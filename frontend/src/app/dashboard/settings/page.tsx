"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Save, User, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Settings() {
  const [profile, setProfile] = useState({ bio: "", skills: "", career_interest: "" });
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await api.get("users/profile/");
      setProfile(res.data);
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch("users/profile/update/", profile);
      toast.success("Profile updated successfully!"); // Meets <5s metric [cite: 52]
    } catch (err) {
      toast.error("Failed to update profile.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 lg:p-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 font-bold mb-8 hover:text-[#3730A3]">
        <ChevronLeft size={20} /> Back to Dashboard
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-indigo-50 text-[#3730A3] rounded-2xl"><User size={28} /></div>
          <h2 className="text-3xl font-black text-[#1F2937]">Profile Settings</h2>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">About You (Bio)</label>
            <textarea 
              value={profile.bio} 
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 ring-indigo-500/20 h-32 font-medium"
              placeholder="Tell us about your tech journey..."
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Skills</label>
            <input 
              type="text" 
              value={profile.skills} 
              onChange={(e) => setProfile({...profile, skills: e.target.value})}
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 ring-indigo-500/20 font-medium"
              placeholder="e.g. Python, React, Data Analysis"
            />
          </div>

          <button type="submit" className="flex items-center justify-center gap-2 w-full bg-[#10B981] text-white p-5 rounded-2xl font-black shadow-lg hover:shadow-emerald-200 transition-all">
            <Save size={20} /> Save Changes
          </button>
        </form>
      </motion.div>
    </div>
  );
}