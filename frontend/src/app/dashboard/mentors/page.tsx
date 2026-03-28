"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Star, ChevronRight, ArrowLeft, ShieldCheck, 
  Zap, X, Send, Briefcase, TrendingUp, Clock, CheckCircle, XCircle, UserMinus, Loader2, AlertTriangle, UserCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function FindMentors() {
  const router = useRouter();
  const { user } = useAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modals State
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState("I'm impressed by your background and would love to have you as my mentor.");
  const [dropTarget, setDropTarget] = useState<{id: number, name: string} | null>(null);

  const fetchData = async () => {
    try {
      const [mentorRes, historyRes] = await Promise.all([
        api.get("users/mentors/"),
        api.get("users/student-requests/") 
      ]);
      setMentors(mentorRes.data);
      setMyRequests(historyRes.data);
    } catch (err) {
      toast.error("Registry sync failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendRequest = async () => {
    if (!selectedMentor) return;
    setIsProcessing(true);
    try {
      await api.post("users/connect/", {
        mentor_id: selectedMentor.id,
        message: requestMessage
      });
      toast.success(`Request sent to ${selectedMentor.username}!`);
      setSelectedMentor(null);
      fetchData(); 
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDropMentor = async () => {
    if (!dropTarget) return;
    setIsProcessing(true);
    try {
        await api.post("users/drop-mentor/");
        toast.success("Mentorship relationship terminated.");
        setDropTarget(null);
        fetchData();
    } catch (err) {
        toast.error("Failed to disconnect.");
    } finally {
        setIsProcessing(false);
    }
  };

  // --- LOGIC: Identify active mentor from the connection history ---
  const activeConnection = myRequests.find(req => req.status === 'ACCEPTED');

  // CLEAN LOADING STATE: White background, fast spinner (No more blue flash)
  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex items-center justify-center">
       <motion.div 
         animate={{ rotate: 360 }} 
         transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
         className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" 
       />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-12 transition-colors duration-500">
      
      {/* 1. THE TOP BANNER (High-visibility management area) */}
      <AnimatePresence>
        {activeConnection && (
          <motion.section 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto mb-12 bg-indigo-600 p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white text-indigo-600 rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-xl">
                  {activeConnection.mentor_name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-black text-white">@{activeConnection.mentor_name}</h2>
                    <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Active Guide</span>
                  </div>
                  <p className="text-indigo-100 font-bold flex items-center gap-2">
                    <UserCheck size={18} /> You are currently matched with this mentor.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setDropTarget({id: activeConnection.id, name: activeConnection.mentor_name})}
                className="px-8 py-5 bg-white/10 hover:bg-red-500 text-white border border-white/20 rounded-2xl font-black text-sm transition-all flex items-center gap-3 shadow-lg"
              >
                <UserMinus size={20} /> End Mentorship
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-4 bg-white dark:bg-[#1E293B] rounded-2xl shadow-lg text-gray-400 hover:text-indigo-600 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-5xl font-black text-[#1F2937] dark:text-white tracking-tight">Find a Mentor</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium italic">Discover experts from our verified registry.</p>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text"
            placeholder="Search mentors or skills..."
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-[#1E293B] rounded-[1.5rem] border-none shadow-xl outline-none focus:ring-2 ring-indigo-500 dark:text-white transition-all font-bold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <section className="max-w-7xl mx-auto mb-20">
        <h2 className="text-2xl font-black mb-8 dark:text-white flex items-center gap-3">
          <Clock className="text-indigo-500" /> My Connection History
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {myRequests.map((req) => (
              <motion.div 
                key={req.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-[#1E293B] p-6 rounded-[2rem] border border-gray-50 dark:border-slate-800 shadow-sm"
              >
                <p className="font-black dark:text-white text-lg">{req.mentor_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  {req.status === 'ACCEPTED' && (
                    <span className="text-emerald-500 flex items-center gap-1 text-xs font-black uppercase tracking-widest">
                      <CheckCircle size={14}/> Accepted
                    </span>
                  )}
                  {req.status === 'DECLINED' && (
                    <span className="text-red-500 flex items-center gap-1 text-xs font-black uppercase tracking-widest">
                      <XCircle size={14}/> Rejected
                    </span>
                  )}
                  {req.status === 'PENDING' && (
                    <span className="text-amber-500 flex items-center gap-1 text-xs font-black uppercase tracking-widest">
                      <Clock size={14}/> Pending
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest">Requested on {req.date}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {myRequests.length === 0 && (
            <p className="text-gray-400 font-bold italic col-span-full">No mentorship requests sent yet.</p>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {mentors.filter(m => 
            m.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((mentor) => {
            const isActiveMentor = activeConnection?.mentor_name === mentor.username;

            return (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-[#1E293B] p-8 rounded-[3.5rem] shadow-xl border border-gray-50 dark:border-slate-800 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <div className="flex items-center gap-6 mb-8 relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#3730A3] to-[#4F46E5] rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-lg">
                    {mentor.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1F2937] dark:text-white">{mentor.username}</h3>
                    <div className="flex items-center gap-2 text-[#10B981] font-bold text-xs uppercase tracking-widest">
                      <ShieldCheck size={14} /> Verified Expert
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8 relative z-10">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 font-bold">
                    <Briefcase size={18} className="text-indigo-500" />
                    <span>{mentor.job_title || "Technical Mentor"} @ {mentor.company || "Industry"}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-medium">
                    <Zap size={18} className="text-amber-400" />
                    <span>{mentor.expertise || "Engineering"}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-medium">
                    <TrendingUp size={18} className="text-blue-500" />
                    <span>{mentor.years_of_experience} Years Exp</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-medium">
                    <Star size={18} className="text-yellow-400" />
                    <span>{mentor.average_rating > 0 ? `${mentor.average_rating} Rating` : "Top Rated"}</span>
                  </div>
                </div>

                {isActiveMentor ? (
                  <div className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black flex items-center justify-center gap-3 border border-indigo-100">
                    <UserCheck size={18} /> Currently Matching
                  </div>
                ) : (
                  <button 
                    onClick={() => setSelectedMentor(mentor)} 
                    disabled={isProcessing || !!activeConnection}
                    className="w-full py-4 bg-[#3730A3] dark:bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg hover:bg-[#10B981] transition-all group disabled:opacity-50 disabled:grayscale"
                  >
                    Send Request <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 2. THE CUSTOM POP-UP: DROP MENTOR CONFIRMATION */}
      <AnimatePresence>
        {dropTarget && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDropTarget(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-[#1E293B] w-full max-w-md p-10 rounded-[3rem] shadow-2xl text-center border border-gray-100 dark:border-slate-800">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={40} /></div>
              <h2 className="text-2xl font-black dark:text-white mb-2">End Mentorship?</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium leading-relaxed">Are you sure you want to disconnect from <span className="font-black text-black dark:text-white">@{dropTarget.name}</span>? This action will stop your active progress tracking with them.</p>
              <div className="flex gap-4">
                <button onClick={handleDropMentor} disabled={isProcessing} className="flex-1 py-5 bg-red-500 text-white rounded-2xl font-black shadow-xl shadow-red-200 flex items-center justify-center">
                   {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm End"}
                </button>
                <button onClick={() => setDropTarget(null)} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 dark:text-white rounded-2xl font-black">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMentor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMentor(null)} className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-[3.5rem] shadow-2xl p-10 border dark:border-slate-800" >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-black dark:text-white">Connect with {selectedMentor.username}</h3>
                  <p className="text-sm font-bold text-gray-400">Start your career journey.</p>
                </div>
                <button onClick={() => setSelectedMentor(null)} className="p-4 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-2xl transition-all" >
                  <X size={28} />
                </button>
              </div>
              <textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Why do you want to connect?" className="w-full h-44 p-6 bg-gray-50 dark:bg-slate-900 rounded-[2rem] outline-none border-2 border-transparent focus:border-indigo-500 dark:text-white font-medium transition-all mb-8 resize-none" />
              <button onClick={handleSendRequest} disabled={isProcessing} className="w-full py-5 bg-[#10B981] text-white rounded-[2rem] font-black flex items-center justify-center gap-4 shadow-xl hover:scale-105 transition-all" >
                {isProcessing ? <Loader2 className="animate-spin" size={22} /> : <><Send size={22} /> Send Official Request</>}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}