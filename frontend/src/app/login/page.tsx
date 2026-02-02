"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (error) {
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-extrabold mb-6 text-primary text-center">Welcome Back</h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-secondary text-white p-3 rounded-lg font-bold hover:brightness-110 transition-all">
            Login to Dashboard
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account? <a href="/register" className="text-primary font-semibold">Register here</a>
          </p>
        </div>
      </form>
    </div>
  );
}