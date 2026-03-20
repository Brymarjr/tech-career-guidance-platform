"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from "sonner";
import { Target } from "lucide-react";

interface PresenceContextType {
    isConnected: boolean;
    unreadNotifications: number;
}

const PresenceContext = createContext<PresenceContextType>({ 
    isConnected: false, 
    unreadNotifications: 0 
});

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const socketRef = useRef<WebSocket | null>(null);
    const lastHeartbeat = useRef<number>(0); // To throttle clicks/mouse moves

    useEffect(() => {
        // CRITICAL: Only initialize if we have a user and NO existing socket
        if (!user?.loggedIn || socketRef.current) return;

        const connectPresence = () => {
            const token = localStorage.getItem('access_token');
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            let host = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000';
            host = host.replace(/^https?:\/\//, ''); 

            const wsUrl = `${protocol}://${host}/ws/presence/?token=${token}`;
            
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log("Presence Connected ✅");
                setIsConnected(true);
                socket.send(JSON.stringify({ type: 'heartbeat' }));
            };

            socket.onclose = (e) => {
                console.log("Presence Closed ❌", e.reason);
                setIsConnected(false);
                socketRef.current = null;
                // Only reconnect if user didn't log out
                if (user?.loggedIn) {
                    setTimeout(connectPresence, 5000);
                }
            };

            socket.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === "UPDATE_BELL_COUNT") {
                    setUnreadNotifications(prev => prev + 1);
                    window.dispatchEvent(new CustomEvent("new-notification", { detail: data.message }));
                    toast.success(data.message, { icon: <Target className="text-indigo-500" /> });
                }
                if (data.type === "NEW_TASK_ASSIGNED") {
                    setUnreadNotifications(prev => prev + 1);
                    toast.info(data.message, {
                        description: `Assigned by ${data.mentor}`,
                        action: { label: "View Tasks", onClick: () => window.dispatchEvent(new Event("open-task-sidebar")) },
                    });
                }
            };
        };

        connectPresence();

        const throttledHeartbeat = () => {
            const now = Date.now();
            // Only send heartbeat if at least 10 seconds passed since the last one
            if (now - lastHeartbeat.current > 10000) {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({ type: 'heartbeat' }));
                    lastHeartbeat.current = now;
                }
            }
        };

        window.addEventListener("mousemove", throttledHeartbeat);
        window.addEventListener("click", throttledHeartbeat);
        window.addEventListener("keydown", throttledHeartbeat);

        const autoHeartbeat = setInterval(throttledHeartbeat, 30000);

        return () => {
            clearInterval(autoHeartbeat);
            window.removeEventListener("mousemove", throttledHeartbeat);
            window.removeEventListener("click", throttledHeartbeat);
            window.removeEventListener("keydown", throttledHeartbeat);
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [user?.loggedIn]); // Only re-run if login status changes

    return (
        <PresenceContext.Provider value={{ isConnected, unreadNotifications }}>
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => useContext(PresenceContext);