"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from "sonner";
import { Target, CheckCircle, AlertCircle } from "lucide-react";

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
    const lastHeartbeat = useRef<number>(0);

    useEffect(() => {
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
                if (user?.loggedIn) {
                    setTimeout(connectPresence, 5000);
                }
            };

            socket.onmessage = (e) => {
                const data = JSON.parse(e.data);
                
                // Handle Standard Notifications
                if (data.type === "UPDATE_BELL_COUNT") {
                    setUnreadNotifications(prev => prev + 1);
                    window.dispatchEvent(new CustomEvent("new-notification", { detail: data.message }));
                    toast.success(data.message, { icon: <Target className="text-indigo-500" /> });
                }

                // Handle Task Notifications (Real-time Badges)
                if (data.type === "task_notification") {
                    // Update global state/badges instantly
                    window.dispatchEvent(new Event("refresh-task-counts"));
                    
                    const isSuccess = data.message.includes("approved") || data.message.includes("submitted");
                    
                    toast(data.message, {
                        icon: isSuccess ? <CheckCircle className="text-emerald-500" /> : <AlertCircle className="text-amber-500" />,
                        description: "Your Mission Log has been updated.",
                    });
                }
            };
        };

        connectPresence();

        const throttledHeartbeat = () => {
            const now = Date.now();
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
    }, [user?.loggedIn]);

    return (
        <PresenceContext.Provider value={{ isConnected, unreadNotifications }}>
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => useContext(PresenceContext);