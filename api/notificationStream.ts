/**
 * SSE client for real-time notification streaming.
 * Uses fetch + ReadableStream where available; degrades silently otherwise.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "../config/api";
import type { Notification } from "../types/notifications";

export interface NotificationStreamEvent {
    type: "snapshot" | "update" | "error";
    notifications?: Notification[];
    message?: string;
}

type OnEventFn = (event: NotificationStreamEvent) => void;
type OnErrorFn = (err: Error) => void;

const MAX_RECONNECT_ATTEMPTS = 5;

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

function parseSSEChunk(
    chunk: string,
    onEvent: OnEventFn
): void {
    // SSE frames are separated by blank lines
    const frames = chunk.split(/\n\n+/);
    for (const frame of frames) {
        if (!frame.trim()) continue;
        let eventName = "";
        let dataLine = "";
        for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
                dataLine = line.slice(5).trim();
            }
        }
        if (!eventName || !dataLine) continue;
        try {
            const parsed = JSON.parse(dataLine);
            if (eventName === "snapshot" || eventName === "update") {
                onEvent({ type: eventName, notifications: parsed.notifications });
            } else if (eventName === "error") {
                onEvent({ type: "error", message: parsed.message });
            }
        } catch {
            // malformed frame — skip
        }
    }
}

/**
 * Connects to the notification SSE stream.
 * Returns a disconnect function. If streaming is unsupported in the current
 * environment, the function returns immediately without calling onError so the
 * REST-based initial load remains the source of truth.
 */
export function connectNotificationStream(
    onEvent: OnEventFn,
    onError: OnErrorFn
): { disconnect: () => void } {
    let aborted = false;
    const abortController = new AbortController();
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    async function connect(attempt: number) {
        if (aborted) return;

        try {
            const token = await getToken();
            if (!token) {
                onError(new Error("Not authenticated"));
                return;
            }

            const url = `${API_CONFIG.BASE_URL}/mobile/notifications/stream?token=${encodeURIComponent(token)}`;

            const response = await fetch(url, {
                method: "GET",
                headers: { Accept: "text/event-stream" },
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`Stream HTTP ${response.status}`);
            }

            // React Native fetch may return null body — degrade gracefully
            if (!response.body) {
                // Streaming not supported; caller relies on REST + pull-to-refresh
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (!aborted) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                // Process complete frames (terminated by \n\n)
                const lastSep = buffer.lastIndexOf("\n\n");
                if (lastSep !== -1) {
                    parseSSEChunk(buffer.slice(0, lastSep + 2), onEvent);
                    buffer = buffer.slice(lastSep + 2);
                }
            }

            reader.releaseLock();
        } catch (err: any) {
            if (aborted || err?.name === "AbortError") return;

            if (attempt < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(2000 * Math.pow(2, attempt), 32000);
                reconnectTimeout = setTimeout(() => connect(attempt + 1), delay);
            } else {
                // Exhaust retries silently — REST + pull-to-refresh remains the fallback
                onError(new Error("Notification stream unavailable after retries"));
            }
        }
    }

    connect(0);

    return {
        disconnect() {
            aborted = true;
            abortController.abort();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        },
    };
}
