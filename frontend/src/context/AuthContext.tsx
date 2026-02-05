"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface User {
  loggedIn: boolean;
  username?: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  // Initialize Auth and Theme
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('theme');

    if (token && savedUser) {
      setUser({ ...JSON.parse(savedUser), loggedIn: true }); 
    }

    // Theme initialization logic
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    setLoading(false);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const login = async (credentials: any) => {
    const res = await api.post("users/login/", credentials);
    const data = res.data;
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const userObj = { ...data.user, loggedIn: true };
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success("Logged out successfully");
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isDarkMode, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};