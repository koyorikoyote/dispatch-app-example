/**
 * EventStreamContext — single SSE connection shared across the whole app.
 *
 * Components don't connect directly. They subscribe via `useEventStream`
 * with a typed listener; the provider holds one SSE socket and fans out
 * frames to every subscriber. This keeps connection count at 1 regardless
 * of how many screens are mounted.
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
    connectEventStream,
    EventStreamFrame,
    EventStreamEventName,
} from "../api/eventStream";

type Listener = (frame: EventStreamFrame) => void;

interface EventStreamContextType {
    /** Whether the SSE socket is currently open. */
    connected: boolean;
    /** Subscribe to all frames; returns an unsubscribe function. */
    subscribe: (fn: Listener) => () => void;
    /**
     * Subscribe to one specific event name. Convenience wrapper around
     * `subscribe` that filters by `frame.name`. Returns the unsubscribe.
     */
    on: <N extends EventStreamEventName>(
        name: N,
        fn: (frame: Extract<EventStreamFrame, { name: N }>) => void
    ) => () => void;
}

const EventStreamContext = createContext<EventStreamContextType | undefined>(undefined);

export function EventStreamProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const listenersRef = useRef<Set<Listener>>(new Set());
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        let disconnected = false;
        const handle = connectEventStream(
            (frame) => {
                if (disconnected) return;
                if (frame.name === "connected") {
                    setConnected(true);
                }
                for (const fn of listenersRef.current) {
                    try {
                        fn(frame);
                    } catch (err) {
                        console.error("EventStream listener error:", err);
                    }
                }
            },
            (err) => {
                console.warn("EventStream:", err.message);
                setConnected(false);
            }
        );

        return () => {
            disconnected = true;
            setConnected(false);
            handle.disconnect();
        };
    }, [isAuthenticated]);

    const subscribe = useCallback((fn: Listener) => {
        listenersRef.current.add(fn);
        return () => {
            listenersRef.current.delete(fn);
        };
    }, []);

    const on = useCallback(<N extends EventStreamEventName>(
        name: N,
        fn: (frame: Extract<EventStreamFrame, { name: N }>) => void
    ): (() => void) => {
        const wrapped: Listener = (frame) => {
            if (frame.name === name) fn(frame as Extract<EventStreamFrame, { name: N }>);
        };
        listenersRef.current.add(wrapped);
        return () => {
            listenersRef.current.delete(wrapped);
        };
    }, []);

    const value = useMemo<EventStreamContextType>(
        () => ({ connected, subscribe, on }),
        [connected, subscribe, on]
    );

    return <EventStreamContext.Provider value={value}>{children}</EventStreamContext.Provider>;
}

export function useEventStream(): EventStreamContextType {
    const ctx = useContext(EventStreamContext);
    if (!ctx) {
        throw new Error("useEventStream must be used within an EventStreamProvider");
    }
    return ctx;
}
