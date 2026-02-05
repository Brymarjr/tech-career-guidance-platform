"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, User, Briefcase, MapPin, Star, 
  ChevronLeft, Send, Sparkles, Filter 
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function MentorDiscovery() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [connectMessage, setConnectMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const fetchMentors = async () => {
    try {
      const res = await api.get("users/mentors/");
      setMentors(res.data);
    } catch (err) {
      toast.error("Failed to load mentors.");
    }
  };

  useEffect(() => { fetchMentors(); }, []);

  const handleConnect = async () => {
    if (!selectedMentor) return;
    setIsSending(true);
    try {
      await api.post("users/connect/", { 
        mentor_id: selectedMentor.id,
        message: connectMessage 
      });
      toast.success(`Request sent to ${selectedMentor.username}!`);
      setSelectedMentor(null);
      setConnectMessage("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send request.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredMentors = mentors.filter(m => 
    m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.skills?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 lg:p-12 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -mr-64 -mt-64 z-0" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 font-bold mb-4 hover:text-[#3730A3] transition-all">
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <h1 className="text-5xl font-black text-[#1F2937] tracking-tight">Find your <span className="text-[#3730A3]">Mentor</span></h1>
            <p className="text-gray-500 font-medium mt-2 text-lg">Connect with industry experts who share your traits.</p>
          </motion.div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search by skill, title, or name..."
              className="w-full p-5 pl-14 bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-indigo-100/20 outline-none focus:ring-4 ring-indigo-50 transition-all font-bold text-[#1F2937]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredMentors.map((mentor) => (
              <motion.div
                layout
                key={mentor.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-xl shadow-indigo-100/10 group relative"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#3730A3] to-[#10B981] rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    {mentor.username[0].toUpperCase()}
                  </div>
                  <div className="px-4 py-1.5 bg-indigo-50 text-[#3730A3] rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Star size={12} fill="#3730A3" /> Top Mentor
                  </div>
                </div>

                <h3 className="text-2xl font-black text-[#1F2937] mb-1">{mentor.full_name || mentor.username}</h3>
                <p className="text-[#10B981] font-bold text-sm mb-4 flex items-center gap-2">
                  <Briefcase size={16} /> {mentor.job_title || "Tech Specialist"} @ {mentor.company || "Stealth"}
                </p>

                <p className="text-gray-400 font-medium text-sm line-clamp-2 mb-6">
                  {mentor.bio || "No bio available. Passionate about helping others grow in their tech careers."}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {mentor.skills?.split(',').map((skill: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-tighter border border-gray-100">
                      {skill.trim()}
                    </span>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMentor(mentor)}
                  className="w-full bg-[#1F2937] text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2 group-hover:bg-[#3730A3] transition-all shadow-lg"
                >
                  <Sparkles size={18} /> Send Connection Request
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Connection Modal */}
      <AnimatePresence>
        {selectedMentor && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMentor(null)} className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg p-12 rounded-[4rem] shadow-2xl border border-gray-100"
            >
              <h2 className="text-4xl font-black text-[#1F2937] mb-2 tracking-tight">Request Help</h2>
              <p className="text-gray-500 font-medium mb-8 uppercase text-xs tracking-[0.2em]">Connecting with {selectedMentor.username}</p>
              
              <textarea 
                className="w-full p-6 bg-gray-50 rounded-[2rem] border border-gray-100 outline-none focus:ring-4 ring-indigo-50 h-40 font-bold text-[#1F2937] placeholder:text-gray-300 mb-8"
                placeholder="Hi! I'm interested in your mentorship because..."
                value={connectMessage}
                onChange={(e) => setConnectMessage(e.target.value)}
              />

              <div className="flex gap-4">
                <button onClick={() => setSelectedMentor(null)} className="flex-1 p-5 bg-gray-100 text-gray-500 rounded-2xl font-black">Cancel</button>
                <button 
                  onClick={handleConnect}
                  disabled={isSending}
                  className="flex-1 p-5 bg-[#10B981] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-100"
                >
                  {isSending ? "Sending..." : <><Send size={20} /> Send Request</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}