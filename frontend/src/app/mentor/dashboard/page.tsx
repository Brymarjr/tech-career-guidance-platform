"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, User, MessageSquare, Clock, ShieldCheck, Mail, LogOut, LayoutDashboard, Settings, Moon, Sun, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; 
import NotificationBell from "@/components/NotificationBell";

export default function MentorDashboard() {
  const { logout, user, isDarkMode, toggleTheme } = useAuth(); 
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const router = useRouter();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const fetchRequests = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const res = await api.get("users/mentor-dashboard/");
      setRequests(res.data);

      // Fetch unread messages count
      const threadsRes = await api.get("users/threads/");
      const totalUnread = threadsRes.data.reduce((acc: number, t: any) => acc + (t.unread_count || 0), 0);
      setUnreadMessages(totalUnread);

    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Access Denied: Mentors Only");
        router.push("/dashboard");
      } else if (err.response?.status !== 401 && localStorage.getItem('access_token')) {
        toast.error("Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'MENTOR' && user.role !== 'ADMIN') {
      router.push("/dashboard");
      return;
    }
    
    if (user && user.loggedIn) {
      fetchRequests();
      // Poll every 30 seconds
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleUpdateStatus = async (requestId: number, newStatus: string) => {
    try {
      await api.patch(`users/mentor-dashboard/${requestId}/`, { status: newStatus });
      toast.success(`Request ${newStatus.toLowerCase()}!`);
      fetchRequests();
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#3730A3] flex items-center justify-center">
       <motion.div 
         animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
         transition={{ repeat: Infinity, duration: 2 }} 
         className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" 
       />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex relative overflow-hidden font-sans transition-colors duration-500">
      
      {/* Sidebar */}
      <aside className="w-80 bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-slate-800 p-8 hidden xl:flex flex-col shadow-sm h-screen sticky top-0 z-10 transition-colors duration-500">
        <div className="mb-12 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#3730A3] to-[#4F46E5] rounded-2xl flex items-center justify-center text-white shadow-lg transform -rotate-3">
            <User size={26} />
          </div>
          <span className="text-2xl font-black text-[#1F2937] dark:text-white tracking-tight">Mentor <span className="text-[#10B981]">Hub</span></span>
        </div>
        
        <nav className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <motion.div whileHover={{ x: 5 }} onClick={() => router.push("/mentor/dashboard")} className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/40 text-[#3730A3] dark:text-indigo-400 rounded-2xl font-black shadow-sm cursor-pointer">
            <LayoutDashboard size={22} /> Student Requests
          </motion.div>
          
          <motion.div 
            whileHover={{ x: 5 }} 
            onClick={() => router.push("/dashboard/messages")}
            className="flex items-center justify-between p-4 text-gray-400 dark:text-gray-500 hover:text-[#3730A3] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <MessageSquare size={22} /> Messages
            </div>
            {unreadMessages > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce font-black">
                {unreadMessages}
              </span>
            )}
          </motion.div>

          <motion.div 
            whileHover={{ x: 5 }} 
            onClick={() => router.push("/dashboard/settings")}
            className="flex items-center gap-4 p-4 text-gray-400 dark:text-gray-500 hover:text-[#3730A3] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all cursor-pointer"
          >
            <Settings size={22} /> Profile Settings
          </motion.div>
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto relative z-0">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-black text-[#1F2937] dark:text-white tracking-tight mb-2">Hello, Mentor {user?.username}!</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Manage your student connections and guidance requests.</p>
          </motion.div>

          <div className="flex items-center gap-6">
            <NotificationBell />

            <div className="relative">
              <div 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-5 bg-white dark:bg-[#1E293B] p-4 pr-10 rounded-[2rem] shadow-xl border border-gray-50 dark:border-slate-800 hover:shadow-2xl transition-all cursor-pointer group z-50"
              >
                <div className="w-14 h-14 bg-gradient-to-tr from-[#3730A3] to-[#10B981] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                  {user?.username ? user.username[0].toUpperCase() : 'M'}
                </div>
                <div>
                   <p className="font-black text-[#1F2937] dark:text-white text-lg">{user?.username}</p>
                   <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-[#3730A3] dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-wider">{user?.role || 'Mentor'}</span>
                </div>
              </div>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-72 bg-white dark:bg-[#1E293B] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-50 dark:border-slate-800 p-4 z-[100] overflow-hidden"
                  >
                    <div className="space-y-2">
                      <button 
                        onClick={() => { router.push("/dashboard/settings"); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-4 p-4 text-gray-500 dark:text-gray-400 hover:text-[#3730A3] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all"
                      >
                        <User size={20} /> My Profile
                      </button>
                      <button 
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-4 text-gray-500 dark:text-gray-400 hover:text-[#3730A3] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all"
                      >
                        <div className="flex items-center gap-4">
                          {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
                          {isDarkMode ? "Light Mode" : "Dark Mode"}
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#10B981]' : 'bg-gray-200'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>

                      <hr className="border-gray-50 dark:border-slate-800 my-2" />
                      <button 
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl font-bold transition-all"
                      >
                        <LogOut size={20} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {requests.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="bg-white dark:bg-[#1E293B] p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100 dark:border-slate-800 transition-colors duration-500"
              >
                <User className="mx-auto text-gray-200 dark:text-slate-700 mb-4" size={64} />
                <p className="text-gray-400 font-bold text-xl">No student requests yet.</p>
              </motion.div>
            ) : (
              requests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-gray-50 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-8 transition-colors duration-500"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-slate-900 text-[#3730A3] dark:text-indigo-400 rounded-[1.5rem] flex items-center justify-center font-black text-2xl">
                      {req.student_name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#1F2937] dark:text-white">{req.student_name}</h3>
                      <div className="flex gap-4 text-sm font-bold text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Mail size={14} /> {req.student_email}</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-4 p-5 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 relative transition-colors duration-500">
                        <MessageSquare className="absolute -top-3 -left-3 text-indigo-200 dark:text-indigo-900/50" size={24} />
                        <p className="text-[#1F2937] dark:text-gray-300 font-medium leading-relaxed italic">"{req.message || "No message provided."}"</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {req.status === 'PENDING' ? (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                          className="bg-[#10B981] text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-emerald-100 hover:scale-105 transition-all"
                        >
                          <Check size={20} /> Accept
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'DECLINED')}
                          className="bg-red-50 dark:bg-red-900/20 text-red-500 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <X size={20} /> Decline
                        </button>
                      </>
                    ) : (
                      <span className={`px-8 py-4 rounded-2xl font-black flex items-center gap-2 ${
                        req.status === 'ACCEPTED' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-[#10B981]' : 'bg-red-50 dark:bg-red-900/20 text-red-400'
                      }`}>
                        <ShieldCheck size={20} /> {req.status}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}