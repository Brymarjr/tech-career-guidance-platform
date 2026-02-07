"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, X, User, MessageSquare, Clock, ShieldCheck, Mail, LogOut, 
  LayoutDashboard, Settings, Moon, Sun, TrendingUp, ExternalLink, 
  ClipboardCheck, AlertCircle, Loader2, Send, Users, Star, Activity 
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; 
import NotificationBell from "@/components/NotificationBell";

export default function MentorDashboard() {
  const { logout, user, isDarkMode, toggleTheme } = useAuth(); 
  const [requests, setRequests] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ active_students: 0, pending_reviews: 0, total_approved: 0 });
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeTab, setActiveTab] = useState<'requests' | 'reviews'>('requests');
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const fetchData = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      // 1. Fetch Student Connection Requests & Dashboard Stats
      const reqRes = await api.get("users/mentor-dashboard/");
      setRequests(reqRes.data.requests || []); // Using .requests from the updated backend view
      setStats(reqRes.data.stats || { active_students: 0, pending_reviews: 0, total_approved: 0 });

      // 2. Fetch Milestone Submissions (Pending Review)
      const reviewRes = await api.get("assessments/reviews/pending/");
      setSubmissions(reviewRes.data);
      
      // 3. Thread / Unread Count
      const unreadRes = await api.get("users/threads/");
      const totalUnread = unreadRes.data.reduce((acc: number, t: any) => acc + (t.unread_count || 0), 0);
      setUnreadMessages(totalUnread);

    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push("/dashboard");
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
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleUpdateStatus = async (requestId: number, newStatus: string) => {
    try {
      await api.patch(`users/mentor-dashboard/${requestId}/`, { status: newStatus });
      toast.success(`Request ${newStatus.toLowerCase()}!`);
      fetchData();
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  const handleReviewWork = async (progressId: number, action: 'APPROVE' | 'REJECT') => {
    if (!reviewFeedback && action === 'REJECT') {
      return toast.error("Please provide feedback for rejection.");
    }

    setReviewingId(progressId);
    try {
      await api.post(`assessments/progress/${progressId}/review/`, {
        action,
        feedback: reviewFeedback
      });
      toast.success(action === 'APPROVE' ? "Milestone Approved!" : "Feedback Sent.");
      setReviewFeedback("");
      setReviewingId(null);
      fetchData();
    } catch (err) {
      toast.error("Review failed to submit.");
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#3730A3] flex items-center justify-center">
       <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex relative overflow-hidden font-sans transition-colors duration-500">
      
      <aside className="w-80 bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-slate-800 p-8 hidden xl:flex flex-col shadow-sm h-screen sticky top-0 z-10 transition-colors duration-500">
        <div className="mb-12 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#3730A3] to-[#4F46E5] rounded-2xl flex items-center justify-center text-white shadow-lg transform -rotate-3">
            <User size={26} />
          </div>
          <span className="text-2xl font-black text-[#1F2937] dark:text-white tracking-tight">Mentor <span className="text-[#10B981]">Hub</span></span>
        </div>
        
        <nav className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <motion.div 
            whileHover={{ x: 5 }}
            onClick={() => setActiveTab('requests')} 
            className={`flex items-center gap-4 p-4 rounded-2xl font-black shadow-sm cursor-pointer transition-all ${activeTab === 'requests' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-[#3730A3] dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={22} /> Student Requests
          </motion.div>

          <motion.div 
            whileHover={{ x: 5 }}
            onClick={() => setActiveTab('reviews')} 
            className={`flex items-center justify-between p-4 rounded-2xl font-black shadow-sm cursor-pointer transition-all ${activeTab === 'reviews' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-[#3730A3] dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-4">
              <ClipboardCheck size={22} /> Milestone Reviews
            </div>
            {submissions.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {submissions.length}
              </span>
            )}
          </motion.div>
          
          <motion.div 
            whileHover={{ x: 5 }}
            onClick={() => router.push("/dashboard/messages")} 
            className="flex items-center justify-between p-4 text-gray-400 dark:text-gray-500 hover:text-[#3730A3] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <MessageSquare size={22} /> Messages
            </div>
            {unreadMessages > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce font-black">{unreadMessages}</span>}
          </motion.div>
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto relative z-0">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-black text-[#1F2937] dark:text-white tracking-tight mb-2">Impact Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
              {activeTab === 'requests' ? 'Manage your student connection requests.' : 'Verify student milestone submissions.'}
            </p>
          </motion.div>

          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="relative">
              <div onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-5 bg-white dark:bg-[#1E293B] p-4 pr-10 rounded-[2rem] shadow-xl border border-gray-50 dark:border-slate-800 hover:shadow-2xl transition-all cursor-pointer group z-50">
                <div className="w-14 h-14 bg-gradient-to-tr from-[#3730A3] to-[#10B981] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                  {user?.username ? user.username[0].toUpperCase() : 'M'}
                </div>
                <div>
                   <p className="font-black text-[#1F2937] dark:text-white text-lg">{user?.username}</p>
                   <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-[#3730A3] dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-wider">Mentor</span>
                </div>
              </div>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-4 w-72 bg-white dark:bg-[#1E293B] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-50 dark:border-slate-800 p-4 z-[100] overflow-hidden">
                    <div className="space-y-2">
                      <button onClick={() => { router.push("/dashboard/settings"); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 text-gray-500 dark:text-gray-400 hover:text-[#3730A3] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all">
                        <User size={20} /> My Profile
                      </button>
                      <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 text-gray-500 dark:text-gray-400 hover:text-[#3730A3] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all">
                        <div className="flex items-center gap-4">
                          {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
                          {isDarkMode ? "Light Mode" : "Dark Mode"}
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#10B981]' : 'bg-gray-200'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>
                      <hr className="border-gray-50 dark:border-slate-800 my-2" />
                      <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl font-bold transition-all">
                        <LogOut size={20} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* STATS STRIP SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { label: "Active Students", value: stats.active_students, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Reviews Pending", value: submissions.length, icon: Activity, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Milestones Verified", value: stats.total_approved, icon: Star, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" }
          ].map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-[#1E293B] p-8 rounded-[3rem] shadow-xl border border-gray-50 dark:border-slate-800 flex items-center gap-6"
            >
              <div className={`p-4 rounded-2xl ${s.bg} ${s.color}`}>
                <s.icon size={28} />
              </div>
              <div>
                <p className="text-gray-400 font-black text-xs uppercase tracking-widest">{s.label}</p>
                <h4 className="text-3xl font-black dark:text-white">{s.value}</h4>
              </div>
            </motion.div>
          ))}
        </div>

        {activeTab === 'requests' ? (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {requests.length === 0 ? (
                <div className="bg-white dark:bg-[#1E293B] p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100 dark:border-slate-800">
                  <User className="mx-auto text-gray-200 dark:text-slate-700 mb-4" size={64} />
                  <p className="text-gray-400 font-bold text-xl">No pending student requests.</p>
                </div>
              ) : (
                requests.map((req) => (
                  <motion.div key={req.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-gray-50 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-20 h-20 bg-indigo-50 dark:bg-slate-900 text-[#3730A3] dark:text-indigo-400 rounded-[1.5rem] flex items-center justify-center font-black text-2xl">{req.student_name[0]}</div>
                      <div>
                        <h3 className="text-2xl font-black dark:text-white">{req.student_name}</h3>
                        <div className="flex gap-4 text-sm font-bold text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Mail size={14} /> {req.student_email}</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400 italic font-medium">"{req.message || "No message provided."}"</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {req.status === 'PENDING' ? (
                        <>
                          <button onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')} className="bg-[#10B981] text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">Accept</button>
                          <button onClick={() => handleUpdateStatus(req.id, 'DECLINED')} className="bg-red-50 text-red-500 px-8 py-4 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all">Decline</button>
                        </>
                      ) : (
                        <span className="px-8 py-4 rounded-2xl font-black bg-gray-50 dark:bg-slate-800 text-gray-400 uppercase text-xs tracking-widest">{req.status}</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {submissions.length === 0 ? (
                <div className="bg-white dark:bg-[#1E293B] p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100 dark:border-slate-800">
                  <ClipboardCheck className="mx-auto text-gray-200 dark:text-slate-700 mb-4" size={64} />
                  <p className="text-gray-400 font-bold text-xl">All caught up! No pending reviews.</p>
                </div>
              ) : (
                submissions.map((sub) => (
                  <motion.div key={sub.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-indigo-50 dark:border-slate-800">
                    <div className="flex flex-col lg:flex-row justify-between gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-4 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">{sub.path_title}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm font-bold text-gray-400">Submitted by {sub.student_name}</span>
                        </div>
                        <h3 className="text-3xl font-black dark:text-white mb-6">{sub.milestone_title}</h3>
                        
                        <div className="space-y-4 mb-8">
                          <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl text-[#3730A3] dark:text-indigo-400 font-bold hover:bg-indigo-50 transition-all w-fit border border-indigo-100 dark:border-slate-800 group">
                            <ExternalLink size={18} className="group-hover:rotate-12 transition-transform" /> View Project Material
                          </a>
                          {sub.submission_notes && (
                            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 italic text-gray-600 dark:text-gray-300">
                              "{sub.submission_notes}"
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Review Feedback</label>
                          <textarea 
                            placeholder="Add constructive feedback for the student..."
                            value={reviewingId === sub.id ? reviewFeedback : ""}
                            onChange={(e) => { setReviewingId(sub.id); setReviewFeedback(e.target.value); }}
                            className="w-full p-6 bg-gray-50 dark:bg-slate-900 rounded-[2rem] border-2 border-transparent focus:border-indigo-500 outline-none font-bold dark:text-white resize-none transition-all"
                            rows={3}
                          />
                          <div className="flex gap-4">
                            <button 
                              onClick={() => handleReviewWork(sub.id, 'APPROVE')} 
                              disabled={reviewingId === sub.id && loading}
                              className="flex-1 bg-[#10B981] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 dark:shadow-none hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                              <Check size={20} /> Approve
                            </button>
                            <button 
                              onClick={() => handleReviewWork(sub.id, 'REJECT')}
                              disabled={reviewingId === sub.id && loading}
                              className="flex-1 bg-red-50 dark:bg-red-900/10 text-red-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                            >
                              <X size={20} /> Request Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}