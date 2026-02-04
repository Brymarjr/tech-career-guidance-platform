"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation"; // Integrated for navigation

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      toast.success("Welcome back! Loading your dashboard...");
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3730A3] via-indigo-800 to-emerald-900 p-6">
      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-indigo-50 rounded-2xl text-primary mb-4"><LogIn size={32} /></div>
          <h2 className="text-4xl font-black text-[#3730A3]">Welcome Back</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="email" placeholder="Email Address" className="w-full p-4 pl-12 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none" onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 pl-12 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none" onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => router.push("/forgot-password")} className="text-sm font-bold text-gray-500 hover:text-[#3730A3]">
              Forgot Password?
            </button>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-[#10B981] text-white font-bold py-4 rounded-2xl shadow-lg">
            Login to Account
          </motion.button>
        </form>

        <p className="mt-8 text-center text-gray-600 font-medium">
          New here? <button onClick={() => router.push("/register")} className="text-[#3730A3] font-bold hover:underline">Create Account</button>
        </p>
      </motion.div>
    </div>
  );
}