"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Save, User, Briefcase, Award, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Settings() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    expertise: "",
    is_available: true,
    skills: "",
    career_interest: "",
    job_title: "",
    company: "",
    years_of_experience: 0,
  });

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
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#0F172A]">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-12 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-6 mb-12">
          <button onClick={() => router.back()} className="p-4 bg-white dark:bg-[#1E293B] rounded-2xl shadow-md dark:text-white hover:scale-105 transition-all">
            <ArrowLeft />
          </button>
          <h1 className="text-4xl font-black text-[#1F2937] dark:text-white tracking-tight">Profile Settings</h1>
        </header>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* NEW: Dedicated Availability Card */}
          {user?.role === 'MENTOR' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] shadow-xl border-2 border-indigo-50 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <h3 className="text-xl font-black dark:text-white">Accepting Mentees</h3>
                <p className="text-sm text-gray-400 font-medium">Toggle your availability for new connection requests.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, is_available: !formData.is_available})}
                className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 ${formData.is_available ? 'bg-[#10B981]' : 'bg-gray-300 dark:bg-slate-700'}`}
              >
                <motion.div 
                  animate={{ x: formData.is_available ? 32 : 0 }}
                  className="w-6 h-6 bg-white rounded-full shadow-md" 
                />
              </button>
            </motion.div>
          )}

          {/* Section: Basic Info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border dark:border-slate-800"
          >
            <h3 className="flex items-center gap-3 text-xl font-black mb-8 dark:text-white">
              <User className="text-indigo-600" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Full Name</label>
                <input 
                  type="text" 
                  value={formData.full_name || ""}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl border-none outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Bio (Max 500 chars)</label>
                <textarea 
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl h-32 border-none outline-none focus:ring-2 ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>
          </motion.div>

          {/* Section: Professional Background */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border dark:border-slate-800"
          >
            <h3 className="flex items-center gap-3 text-xl font-black mb-8 dark:text-white">
              <Briefcase className="text-emerald-500" /> Professional Background
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Current Job Title</label>
                <input 
                  type="text" 
                  value={formData.job_title || ""}
                  onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl border-none outline-none focus:ring-2 ring-indigo-500 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Company</label>
                <input 
                  type="text" 
                  value={formData.company || ""}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl border-none outline-none focus:ring-2 ring-indigo-500 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Primary Expertise</label>
                <input 
                  type="text" 
                  value={formData.expertise || ""}
                  placeholder="e.g. Backend Development"
                  onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                  className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl border-none outline-none focus:ring-2 ring-indigo-500 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Years of Experience</label>
                <input 
                  type="number" 
                  value={formData.years_of_experience}
                  onChange={(e) => setFormData({...formData, years_of_experience: e.target.value === "" ? 0 : parseInt(e.target.value)})}
                  className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-white rounded-xl border-none outline-none focus:ring-2 ring-indigo-500 font-bold"
                />
              </div>
            </div>
          </motion.div>

          <button 
            disabled={saving}
            className="w-full py-6 bg-[#10B981] text-white rounded-[2rem] font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-70"
          >
            {saving ? <Loader2 className="animate-spin" /> : <><Save /> Save All Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}