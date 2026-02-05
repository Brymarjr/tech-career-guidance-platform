"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Star, ChevronRight, ArrowLeft, ShieldCheck, 
  Zap, X, Send, Briefcase, TrendingUp, Clock, CheckCircle, XCircle 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function FindMentors() {
  const router = useRouter();
  const { user } = useAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]); // NEW: History state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Connection Modal State
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState("I'm impressed by your background and would love to have you as my mentor.");

  const fetchData = async () => {
    try {
      // Fetch both mentors and the student's own request history
      const [mentorRes, historyRes] = await Promise.all([
        api.get("users/mentors/"),
        api.get("users/student-requests/") // Matches the URL defined above
      ]);
      setMentors(mentorRes.data);
      setMyRequests(historyRes.data);
    } catch (err) {
      toast.error("Failed to sync mentorship data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendRequest = async () => {
    if (!selectedMentor) return;
    
    try {
      await api.post("users/connect/", {
        mentor_id: selectedMentor.id,
        message: requestMessage
      });
      toast.success(`Request sent to ${selectedMentor.username}!`);
      setSelectedMentor(null);
      setRequestMessage("I'm impressed by your background and would love to have you as my mentor.");
      fetchData(); // Refresh history after sending
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send request.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#3730A3] flex items-center justify-center">
       <motion.div 
         animate={{ rotate: 360 }} 
         transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
         className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full shadow-lg" 
       />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-12 transition-colors duration-500">
      
      {/* Header Section */}
      <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-4 bg-white dark:bg-[#1E293B] rounded-2xl shadow-lg text-gray-400 hover:text-[#3730A3] dark:hover:text-white transition-all"
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

      {/* NEW: CONNECTION HISTORY SECTION */}
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

      {/* Mentor Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {mentors.filter(m => 
            m.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((mentor) => (
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
                    <ShieldCheck size={14} /> Verified {mentor.role}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8 relative z-10">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 font-bold">
                  <Briefcase size={18} className="text-indigo-500" />
                  <span>{mentor.job_title || "Professional"} @ {mentor.company || "Industry"}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-medium">
                  <Zap size={18} className="text-amber-400" />
                  <span>{mentor.expertise || "Multi-disciplinary"}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-medium">
                  <TrendingUp size={18} className="text-blue-500" />
                  <span>{mentor.years_of_experience} Years Experience</span>
                </div>
                
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-medium">
                  <Star size={18} className="text-yellow-400" />
                  <span>{mentor.average_rating > 0 ? `${mentor.average_rating} Rating` : "New Mentor"}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedMentor(mentor)}
                className="w-full py-4 bg-[#3730A3] dark:bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg hover:bg-[#10B981] transition-all group"
              >
                Send Request <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Connection Request Modal */}
      <AnimatePresence>
        {selectedMentor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedMentor(null)} 
              className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-[3.5rem] shadow-2xl p-10 border dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-black dark:text-white">Connect with {selectedMentor.username}</h3>
                  <p className="text-sm font-bold text-gray-400">Introduce yourself to start your journey.</p>
                </div>
                <button 
                  onClick={() => setSelectedMentor(null)} 
                  className="p-4 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
                >
                  <X size={28} />
                </button>
              </div>

              <textarea 
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Why do you want to connect?"
                className="w-full h-44 p-6 bg-gray-50 dark:bg-slate-900 rounded-[2rem] outline-none border-2 border-transparent focus:border-indigo-500 dark:text-white font-medium transition-all mb-8 resize-none"
              />

              <button 
                onClick={handleSendRequest}
                className="w-full py-5 bg-[#10B981] text-white rounded-[2rem] font-black flex items-center justify-center gap-4 shadow-xl hover:scale-105 transition-all"
              >
                <Send size={22} /> Send Official Request
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}