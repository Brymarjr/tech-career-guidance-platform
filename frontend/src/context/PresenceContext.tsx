"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from "sonner";
import { Target } from "lucide-react";

interface PresenceContextType {
    isConnected: boolean;
    unreadNotifications: number; // Added tracking
}

const PresenceContext = createContext<PresenceContextType>({ isConnected: false, unreadNotifications: 0 });

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        if (!user?.loggedIn) return;

        const token = localStorage.getItem('access_token');
        const wsUrl = `ws://localhost:8000/ws/presence/?token=${token}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => setIsConnected(true);
        socket.onclose = () => setIsConnected(false);

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            
            // Handle the Bell Icon Update
            if (data.type === "UPDATE_BELL_COUNT") {
                setUnreadNotifications(prev => prev + 1);
                // Dispatch event so Navbar can hear it if it's not using context
                window.dispatchEvent(new CustomEvent("new-notification", { detail: data.message }));
                
                toast.success(data.message, {
                    icon: <Target className="text-indigo-500" />,
                });
            }

            if (data.type === "NEW_TASK_ASSIGNED") {
                setUnreadNotifications(prev => prev + 1);
                toast.info(data.message, {
                    description: `Assigned by ${data.mentor}`,
                    action: {
                        label: "View Tasks",
                        onClick: () => window.dispatchEvent(new Event("open-task-sidebar"))
                    },
                });
            }
        };

        const handleForceLogout = () => socket.close();
        window.addEventListener("force-logout", handleForceLogout);

        return () => {
            socket.close();
            window.removeEventListener("force-logout", handleForceLogout);
        };
    }, [user?.loggedIn]);

    return (
        <PresenceContext.Provider value={{ isConnected, unreadNotifications }}>
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => useContext(PresenceContext);