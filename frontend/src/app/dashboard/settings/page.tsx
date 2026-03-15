"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Save, User, Briefcase, ArrowLeft, Loader2, ShieldCheck, Lock, Award, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Settings() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passData, setPassData] = useState({ old_password: "", new_password: "" });
  
  const [formData, setFormData] = useState({
    full_name: "", bio: "", expertise: "", is_available: true,
    skills: "", career_interest: "", job_title: "", company: "", years_of_experience: 0,
  });

  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("users/profile/"); 
        setFormData(res.data);
      } catch (err) {
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("users/profile/", formData); 
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passData.old_password || !passData.new_password) {
      return toast.error("Both password fields are required.");
    }
    try {
      await api.post("users/change-password/", passData);
      toast.success("Password updated successfully!");
      setPassData({ old_password: "", new_password: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Password update failed.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#0F172A]">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-12 transition-colors duration-500" ref={pageRef}>
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-6 mb-12">
          <button onClick={() => router.back()} className="p-4 bg-white dark:bg-[#1E293B] rounded-2xl shadow-md dark:text-white hover:scale-105 transition-all">
            <ArrowLeft />
          </button>
          <h1 className="text-4xl font-black text-[#1F2937] dark:text-white tracking-tight">Profile Settings</h1>
        </header>

        <div className="space-y-8 pb-20">
          {/* MENTOR AVAILABILITY */}
          {user?.role === 'MENTOR' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] shadow-xl border-2 border-indigo-50 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black dark:text-white">Mentorship Availability</h3>
                <p className="text-sm text-gray-400 font-medium">Toggle your availability for new connection requests.</p>
              </div>
              <button type="button" onClick={() => setFormData({...formData, is_available: !formData.is_available})} className={`w-16 h-8 rounded-full p-1 transition-colors ${formData.is_available ? 'bg-[#10B981]' : 'bg-gray-300 dark:bg-slate-700'}`}>
                <motion.div animate={{ x: formData.is_available ? 32 : 0 }} className="w-6 h-6 bg-white rounded-full shadow-md" />
              </button>
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* BASIC INFO */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border dark:border-slate-800">
              <h3 className="flex items-center gap-3 text-xl font-black mb-8 dark:text-white"><User className="text-indigo-600" /> Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Full Name</label>
                  <input type="text" value={formData.full_name || ""} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl border-none outline-none focus:ring-2 ring-indigo-500 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Bio (Max 500 chars)</label>
                  <textarea value={formData.bio || ""} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl h-32 border-none outline-none focus:ring-2 ring-indigo-500" />
                </div>
              </div>
            </motion.div>

            {/* PROFESSIONAL BACKGROUND - FULLY RESTORED */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border dark:border-slate-800">
              <h3 className="flex items-center gap-3 text-xl font-black mb-8 dark:text-white"><Briefcase className="text-emerald-500" /> Professional Background</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Job Title</label>
                  <input type="text" value={formData.job_title || ""} onChange={(e) => setFormData({...formData, job_title: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Company</label>
                  <input type="text" value={formData.company || ""} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Expertise</label>
                  <input type="text" value={formData.expertise || ""} onChange={(e) => setFormData({...formData, expertise: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Years of Experience</label>
                  <input type="number" value={formData.years_of_experience} onChange={(e) => setFormData({...formData, years_of_experience: parseInt(e.target.value) || 0})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold" />
                </div>
              </div>
            </motion.div>

            {/* SKILLS & INTERESTS - FULLY RESTORED */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border dark:border-slate-800">
              <h3 className="flex items-center gap-3 text-xl font-black mb-8 dark:text-white"><Target className="text-amber-500" /> Focus Area</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Skills (Comma separated)</label>
                  <input type="text" value={formData.skills || ""} onChange={(e) => setFormData({...formData, skills: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Career Interest</label>
                  <input type="text" value={formData.career_interest || ""} onChange={(e) => setFormData({...formData, career_interest: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold" />
                </div>
              </div>
            </motion.div>

            <button type="submit" disabled={saving} className="w-full py-6 bg-[#10B981] text-white rounded-[2rem] font-black text-xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4">
              {saving ? <Loader2 className="animate-spin" /> : <><Save /> Save All Profile Changes</>}
            </button>
          </form>

          {/* SECURITY SECTION */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border-2 border-red-50 dark:border-red-900/20">
            <h3 className="flex items-center gap-3 text-xl font-black mb-8 dark:text-white"><ShieldCheck className="text-red-500" /> Account Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="password" placeholder="Current Password" value={passData.old_password} onChange={(e) => setPassData({...passData, old_password: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-red-500" />
              <input type="password" placeholder="New Password" value={passData.new_password} onChange={(e) => setPassData({...passData, new_password: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-emerald-500" />
            </div>
            <button onClick={handleChangePassword} className="mt-6 px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all"><Lock size={18} /> Update Password</button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}