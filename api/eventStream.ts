/**
 * Push-based SSE client for the unified /api/mobile/events/stream endpoint.
 *
 * Streams typed events (reply-changed, reply-read, record-changed) from the
 * manager-app server. Uses fetch + ReadableStream where available and falls
 * back silently on environments that don't expose a streamable body.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "../config/api";

export type EventStreamEventName =
    | "connected"
    | "reply-changed"
    | "reply-read"
    | "record-changed";

export interface ReplyChangedFrame {
    action: "create" | "update" | "delete";
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction";
    tableName: "inquiries" | "daily_record" | "complaint_details" | "interaction_records";
    parentId: number;
    replyId: number;
    reply: Record<string, unknown> | null;
    fromDispatchApp: boolean;
    timestamp: number;
}

export interface ReplyReadFrame {
    replyId: number;
    timestamp: number;
}

export interface RecordChangedFrame {
    action: "create" | "update" | "delete";
    tableName: "inquiries" | "daily_record" | "complaint_details" | "interaction_records";
    recordId: number;
    record: Record<string, unknown> | null;
    timestamp: number;
}

export type EventStreamFrame =
    | { name: "connected"; data: { timestamp: number } }
    | { name: "reply-changed"; data: ReplyChangedFrame }
    | { name: "reply-read"; data: ReplyReadFrame }
    | { name: "record-changed"; data: RecordChangedFrame };

type OnEventFn = (event: EventStreamFrame) => void;
type OnErrorFn = (err: Error) => void;

const MAX_RECONNECT_ATTEMPTS = 8;

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

function parseSSEChunk(chunk: string, onEvent: OnEventFn): void {
    const frames = chunk.split(/\n\n+/);
    for (const frame of frames) {
        if (!frame.trim()) continue;
        let eventName = "";
        let dataLine = "";
        for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
        }
        if (!eventName || !dataLine) continue;
        try {
            const parsed = JSON.parse(dataLine);
            if (
                eventName === "connected" ||
                eventName === "reply-changed" ||
                eventName === "reply-read" ||
                eventName === "record-changed"
            ) {
                onEvent({ name: eventName as EventStreamEventName, data: parsed } as EventStreamFrame);
            }
        } catch {
            // malformed frame — ignore
        }
    }
}

export interface ConnectOptions {
    /** Filter: only forward reply events for these parent types. */
    replyParentType?: Array<"inquiry" | "dailyRecord" | "complaint" | "interaction">;
    /** Filter: only forward reply events for these parent ids. */
    replyParentId?: number[];
    /** Filter: only forward record events for these tables. */
    recordTables?: Array<
        "inquiries" | "daily_record" | "complaint_details" | "interaction_records"
    >;
}

/**
 * Connects to the unified events SSE firehose. Returns a disconnect function.
 * Reconnects with exponential back-off; surfaces a single error after the
 * retry budget is exhausted so callers can fall back to REST + manual refresh.
 */
export function connectEventStream(
    onEvent: OnEventFn,
    onError: OnErrorFn,
    options: ConnectOptions = {}
): { disconnect: () => void } {
    let aborted = false;
    let abortController = new AbortController();
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const buildUrl = (): string => {
        const params = new URLSearchParams();
        if (options.replyParentType?.length) {
            params.set("replyParentType", options.replyParentType.join(","));
        }
        if (options.replyParentId?.length) {
            params.set("replyParentId", options.replyParentId.join(","));
        }
        if (options.recordTables?.length) {
            params.set("recordTables", options.recordTables.join(","));
        }
        const qs = params.toString();
        return `${API_CONFIG.BASE_URL}/mobile/events/stream${qs ? `?${qs}` : ""}`;
    };

    async function connect(attempt: number): Promise<void> {
        if (aborted) return;

        try {
            const token = await getToken();
            if (!token) {
                onError(new Error("Not authenticated"));
                return;
            }

            abortController = new AbortController();
            const response = await fetch(buildUrl(), {
                method: "GET",
                headers: {
                    Accept: "text/event-stream",
                    Authorization: `Bearer ${token}`,
                },
                signal: abortController.signal,
            });

            if (!response.ok) throw new Error(`Stream HTTP ${response.status}`);
            if (!response.body) return; // streaming unsupported; caller relies on REST

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (!aborted) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lastSep = buffer.lastIndexOf("\n\n");
                if (lastSep !== -1) {
                    parseSSEChunk(buffer.slice(0, lastSep + 2), onEvent);
                    buffer = buffer.slice(lastSep + 2);
                }
            }

            reader.releaseLock();
        } catch (err: unknown) {
            if (aborted) return;
            const e = err as { name?: string };
            if (e?.name === "AbortError") return;

            if (attempt < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(2000 * Math.pow(2, attempt), 32000);
                reconnectTimeout = setTimeout(() => {
                    void connect(attempt + 1);
                }, delay);
            } else {
                onError(new Error("Event stream unavailable after retries"));
            }
        }
    }

    void connect(0);

    return {
        disconnect() {
            aborted = true;
            abortController.abort();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        },
    };
}
