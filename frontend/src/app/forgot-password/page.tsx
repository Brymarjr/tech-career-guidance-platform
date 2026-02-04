"use client";

import { useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("users/password-reset/request/", { email });
      toast.success(res.data.message);
      setStep(2);
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error("This email is not registered in our database.");
      } else {
        // Specifically catch the SMTP/Server error [cite: 29]
        toast.error(err.response?.data?.error || "Mail service is temporarily unavailable.");
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("users/password-reset/verify/", { email, otp });
      toast.success("OTP Verified!");
      setStep(3);
    } catch (err) { toast.error("Invalid or expired OTP."); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("users/password-reset/confirm/", { email, new_password: newPassword });
      toast.success("Password reset successful! Redirecting to login...");
      router.push("/login");
    } catch (err) { toast.error("Failed to reset password."); }
  };

  return (
    <div className="min-h-screen bg-[#3730A3] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-black text-[#1F2937] mb-6">Reset Password</h2>
        
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <p className="text-gray-500 font-medium">Enter your email to receive a reset code.</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100" required />
            <button className="w-full bg-[#10B981] text-white p-4 rounded-2xl font-black">Send OTP</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-gray-500 font-medium">Enter the 6-digit code sent to {email}.</p>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100" maxLength={6} required />
            <button className="w-full bg-[#3730A3] text-white p-4 rounded-2xl font-black">Verify Code</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-gray-500 font-medium">Enter your new secure password.</p>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100" required />
            <button className="w-full bg-[#10B981] text-white p-4 rounded-2xl font-black">Update Password</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}