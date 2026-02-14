"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface PresenceContextType {
    isConnected: boolean;
}

const PresenceContext = createContext<PresenceContextType>({ isConnected: false });

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user?.loggedIn) return;

        const token = localStorage.getItem('access_token');
        const wsUrl = `ws://localhost:8000/ws/presence/?token=${token}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => setIsConnected(true);
        socket.onclose = () => setIsConnected(false);

        // NEW: Listen for the manual logout event
        const handleForceLogout = () => {
            socket.close(); // This triggers the 'disconnect' on the Django side
        };

        window.addEventListener("force-logout", handleForceLogout);

        return () => {
            socket.close();
            window.removeEventListener("force-logout", handleForceLogout);
        };
    }, [user?.loggedIn]);

    return (
        <PresenceContext.Provider value={{ isConnected }}>
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => useContext(PresenceContext);