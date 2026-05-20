/**
 * Dedicated per-thread SSE subscription for chat replies.
 *
 * Bypasses EventStreamContext to keep the chat live-update path as short and
 * verifiable as possible: this hook opens its own filtered SSE connection
 * straight to /api/mobile/events/stream, parses frames inline, and invokes a
 * single callback when a reply-changed event for THIS thread arrives.
 *
 * The connection lives only while the consuming component is mounted (i.e.
 * the dialog is open). On unmount the underlying fetch is aborted.
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "../config/api";

export interface ReplyChangedPayload {
    action: "create" | "update" | "delete";
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction";
    tableName: "inquiries" | "daily_record" | "complaint_details" | "interaction_records";
    parentId: number;
    replyId: number;
    reply: Record<string, unknown> | null;
    fromDispatchApp: boolean;
    timestamp: number;
}

interface Options {
    /** ConversationService-style discriminator. */
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction";
    parentId: number;
    enabled?: boolean;
    onReplyChanged: (payload: ReplyChangedPayload) => void;
}

async function getToken(): Promise<string | null> {
    try {
        if (Platform.OS === "web") {
            return localStorage.getItem("auth_token");
        }
        if (SecureStore && typeof SecureStore.getItemAsync === "function") {
            return await SecureStore.getItemAsync("auth_token");
        }
        return null;
    } catch {
        return null;
    }
}

export function useMessageRepliesSSE({
    parentType,
    parentId,
    enabled = true,
    onReplyChanged,
}: Options): void {
    const handlerRef = useRef(onReplyChanged);
    useEffect(() => {
        handlerRef.current = onReplyChanged;
    }, [onReplyChanged]);

    useEffect(() => {
        if (!enabled || !parentId) return;

        let cancelled = false;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let reconnectDelay = 2000;
        let controller: AbortController | null = null;

        const connect = async (): Promise<void> => {
            if (cancelled) return;
            const token = await getToken();
            if (!token) {
                // Try again shortly — token may not be persisted yet right after login.
                reconnectTimer = setTimeout(connect, 1500);
                return;
            }

            controller = new AbortController();
            try {
                const params = new URLSearchParams({
                    replyParentType: parentType,
                    replyParentId: String(parentId),
                });
                const response = await fetch(
                    `${API_CONFIG.BASE_URL}/mobile/events/stream?${params.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "text/event-stream",
                            // Authorization in the header — same path the
                            // apiClient REST flow uses and that the manager-app
                            // webpack dev-server proxy is known to forward
                            // correctly. Query-param tokens were silently
                            // rejected in this environment.
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok || !response.body) {
                    throw new Error(`Stream HTTP ${response.status}`);
                }

                reconnectDelay = 2000;

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (!cancelled) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const frames = buffer.split(/\n\n+/);
                    buffer = frames.pop() ?? "";

                    for (const frame of frames) {
                        if (!frame.trim()) continue;
                        let eventName = "";
                        let dataLine = "";
                        for (const line of frame.split("\n")) {
                            if (line.startsWith("event:")) eventName = line.slice(6).trim();
                            else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
                        }
                        if (eventName === "reply-changed" && dataLine) {
                            try {
                                const payload = JSON.parse(dataLine) as ReplyChangedPayload;
                                handlerRef.current(payload);
                            } catch {
                                // ignore malformed frame
                            }
                        }
                    }
                }
            } catch (err: unknown) {
                if (cancelled) return;
                const e = err as { name?: string };
                if (e?.name === "AbortError") return;
                console.warn("MessageReplies SSE error:", err);
            }

            if (!cancelled) {
                const delay = Math.min(reconnectDelay, 30000);
                reconnectDelay = Math.min(reconnectDelay * 2, 30000);
                reconnectTimer = setTimeout(connect, delay);
            }
        };

        void connect();

        return () => {
            cancelled = true;
            controller?.abort();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, [enabled, parentType, parentId]);
}
