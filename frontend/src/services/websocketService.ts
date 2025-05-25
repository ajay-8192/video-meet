import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
    type: 'message' | 'typing' | 'read_receipt' | 'user_joined' | 'user_left' | 'error';
    roomId: string;
    userId: string;
    content?: string;
    timestamp: string;
    metadata?: {
        isTyping?: boolean;
        readBy?: string[];
        messageId?: string;
        userName?: string;
        userAvatar?: string;
    };
}

export const useWebSocket = (roomId: string, onMessage: (message: WebSocketMessage) => void) => {
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<number | undefined>(undefined);
    const messageQueue = useRef<WebSocketMessage[]>([]);

    const connect = useCallback(() => {
        if (!roomId) return;

        // Clear any existing connection
        if (ws.current) {
            ws.current.close();
        }

        // Clear any pending reconnect
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }

        const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/api/ws/${roomId}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            // Send any queued messages
            while (messageQueue.current.length > 0) {
                const message = messageQueue.current.shift();
                if (message && ws.current?.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify(message));
                }
            }
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data) as WebSocketMessage;
                onMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
            // Attempt to reconnect after 3 seconds
            reconnectTimeout.current = window.setTimeout(connect, 3000);
        };
    }, [roomId, onMessage]);

    useEffect(() => {
        connect();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [connect]);

    const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
        const messageWithTimestamp = {
            ...message,
            timestamp: new Date().toISOString()
        };

        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(messageWithTimestamp));
        } else {
            // Queue the message if the connection is not ready
            messageQueue.current.push(messageWithTimestamp);
        }
    }, []);

    return { sendMessage };
}; 