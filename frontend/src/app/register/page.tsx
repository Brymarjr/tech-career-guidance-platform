"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    role: "STUDENT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calling our v1 versioned API
      await api.post("users/register/", formData);
      alert("Registration Successful! Redirecting to login...");
      router.push("/login");
    } catch (error: any) {
      console.error("Registration failed", error.response?.data);
      alert("Registration failed. Please check your details.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-extrabold mb-2 text-primary text-center">Join the Platform</h2>
        <p className="text-gray-500 text-center mb-8">Start your tech career journey today.</p>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          
          <select 
            className="w-full p-3 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            value={formData.role}
          >
            <option value="STUDENT">I am a Student / Career Seeker</option>
            <option value="MENTOR">I am a Mentor</option>
          </select>

          <button type="submit" className="w-full bg-secondary text-white p-3 rounded-lg font-bold hover:brightness-110 active:scale-[0.98] transition-all mt-4">
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}