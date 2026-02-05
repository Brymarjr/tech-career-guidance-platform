"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from "sonner"; // RESTORED IMPORT

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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser({ ...JSON.parse(savedUser), loggedIn: true }); 
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    const res = await api.post("users/login/", credentials);
    const data = res.data;

    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    // LOGIC ADDED: Store the specific user object with role
    const userObj = { ...data.user, loggedIn: true };
    localStorage.setItem('user', JSON.stringify(userObj));
    
    setUser(userObj);
    return data; // LOGIC ADDED: Return data for the Login Page to use
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user'); // LOGIC ADDED: Clear user data
    setUser(null);
    toast.success("Logged out successfully");
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};