"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Rocket, Brain } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    role: "STUDENT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promise = api.post("users/register/", formData);

    toast.promise(promise, {
      loading: 'Creating your career profile...',
      success: () => {
        setTimeout(() => router.push("/login"), 2000);
        return 'Account created! Welcome to the future of tech.';
      },
      error: (err) => {
        const detail = err.response?.data?.email || err.response?.data?.username || "Check your details.";
        return `Registration failed: ${detail}`;
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-[#3730A3] to-emerald-900 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-white/20"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-[#3730A3] mb-2 tracking-tight">Create Account</h2>
          <p className="text-gray-500 font-medium">Join our tech career community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 outline-none transition-all text-gray-900"
            placeholder="Username"
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <input
            type="email"
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 outline-none transition-all text-gray-900"
            placeholder="Email Address"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 outline-none transition-all text-gray-900"
              placeholder="Password"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3730A3] transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <select 
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#10B981] outline-none transition-all text-gray-900 appearance-none cursor-pointer"
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="STUDENT">Student / Learner</option>
              <option value="MENTOR">Mentor / Professional</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#10B981]">
              {formData.role === "STUDENT" ? <Rocket size={20} /> : <Brain size={20} />}
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "#059669" }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full bg-[#10B981] text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all block text-center !opacity-100"
            style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
          >
            Create My Account
          </motion.button>
        </form>

        <p className="mt-8 text-center text-gray-600 font-medium">
          Already a member? <a href="/login" className="text-[#3730A3] font-bold hover:underline">Sign In</a>
        </p>
      </motion.div>
    </div>
  );
}