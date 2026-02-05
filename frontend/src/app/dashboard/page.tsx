"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from "recharts";
import { 
  LayoutDashboard, Award, BookOpen, ChevronRight, 
  User, LogOut, Target, Sparkles, TrendingUp, X, ExternalLink, CheckCircle2, Send, Settings, Moon, Sun
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  
  // Header Menu States
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); 
  
  // Phase 4: AI Mentor State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchDashboard = async () => {
    // STRICT LOGIC FIX: Check for token existence before making the call
    const token = typeof window !== "undefined" ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const res = await api.get("assessments/dashboard-summary/");
      setData(res.data);
      
      if (res.data.assessment?.scores) {
        const mapping: any = {
          'R': 'Realistic', 'I': 'Investigative', 'A': 'Artistic',
          'S': 'Social', 'E': 'Enterprising', 'C': 'Conventional'
        };
        const formatted = Object.keys(res.data.assessment.scores).map(key => ({
          subject: mapping[key] || key,
          value: res.data.assessment.scores[key],
          fullMark: 10,
        }));
        setChartData(formatted);
      }
    } catch (err: any) {
      // Only show error if we aren't unauthorized (which happens during logout)
      if (err.response?.status !== 401 && localStorage.getItem('access_token')) {
        console.error("Dashboard load failed", err);
        toast.error("Failed to load dashboard data");
      }
    }
  };

  useEffect(() => {
    // Redirect Mentors
    if (user && user.role === 'MENTOR') {
      router.push("/mentor/dashboard");
      return;
    }

    // Only fetch if a user is truly present and logged in
    if (user && user.loggedIn) {
      fetchDashboard();
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleToggleMilestone = async (e: React.MouseEvent, milestoneId: number) => {
    e.stopPropagation();
    try {
      const res = await api.post(`assessments/milestone/${milestoneId}/toggle/`);
      if (res.data.is_completed) {
        toast.success(`Milestone "${res.data.milestone}" completed!`);
      }
      fetchDashboard();
    } catch (err) {
      toast.error("Failed to update progress");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await api.post("assessments/chat/", { message: chatInput });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err: any) {
      toast.error("AI Mentor is currently unavailable.");
    } finally {
      setIsTyping(false);
    }
  };

  if (!data) return (
    <div className="min-h-screen bg-[#3730A3] flex items-center justify-center">
       <motion.div 
         animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
         transition={{ repeat: Infinity, duration: 2 }} 
         className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" 
       />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex relative overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-gray-100 p-8 hidden xl:flex flex-col shadow-sm h-screen sticky top-0 z-10">
        <div className="mb-12 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#3730A3] to-[#4F46E5] rounded-2xl flex items-center justify-center text-white shadow-lg transform -rotate-3">
            <TrendingUp size={26} />
          </div>
          <span className="text-2xl font-black text-[#1F2937] tracking-tight">TechPath <span className="text-[#10B981]">Pro</span></span>
        </div>
        
        <nav className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <motion.div whileHover={{ x: 5 }} className="flex items-center gap-4 p-4 bg-indigo-50 text-[#3730A3] rounded-2xl font-black shadow-sm cursor-pointer">
            <LayoutDashboard size={22} /> Dashboard
          </motion.div>

          <motion.div 
            whileHover={{ x: 5 }} 
            onClick={() => router.push("/dashboard/mentors")}
            className="flex items-center gap-4 p-4 text-gray-400 hover:text-[#3730A3] hover:bg-gray-50 rounded-2xl font-bold transition-all cursor-pointer"
          >
            <Target size={22} /> Find Mentors
          </motion.div>

          <motion.div whileHover={{ x: 5 }} className="flex items-center gap-4 p-4 text-gray-400 hover:text-[#3730A3] hover:bg-gray-50 rounded-2xl font-bold transition-all cursor-pointer">
            <Award size={22} /> Career Roadmap
          </motion.div>
          
          <motion.div whileHover={{ x: 5 }} className="flex items-center gap-4 p-4 text-gray-400 hover:text-[#3730A3] hover:bg-gray-50 rounded-2xl font-bold transition-all cursor-pointer">
            <BookOpen size={22} /> Learning Library
          </motion.div>

          <motion.div 
            whileHover={{ x: 5 }} 
            onClick={() => router.push("/dashboard/settings")}
            className="flex items-center gap-4 p-4 text-gray-400 hover:text-[#3730A3] hover:bg-gray-50 rounded-2xl font-bold transition-all cursor-pointer"
          >
            <Settings size={22} /> Profile Settings
          </motion.div>
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto relative z-0">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-black text-[#111827] mb-3 tracking-tight">Hello, {data.user.username}! ✨</h1>
            <p className="text-[#6B7280] text-xl font-medium">Your <span className="text-[#3730A3] font-bold">{data.roadmap?.title}</span> is looking strong today.</p>
          </motion.div>
          
          <div className="relative">
            <div 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-5 bg-white p-4 pr-10 rounded-[2rem] shadow-xl border border-gray-50 hover:shadow-2xl transition-all cursor-pointer group z-50"
            >
              <div className="w-14 h-14 bg-gradient-to-tr from-[#3730A3] to-[#10B981] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                {data.user.username[0].toUpperCase()}
              </div>
              <div>
                 <p className="font-black text-[#1F2937] text-lg">{data.user.username}</p>
                 <span className="px-3 py-1 bg-indigo-50 text-[#3730A3] rounded-full text-[10px] font-black uppercase tracking-wider">{data.user.role || 'Member'}</span>
              </div>
            </div>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-72 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-50 p-4 z-[100] overflow-hidden"
                >
                  <div className="space-y-2">
                    <button 
                      onClick={() => { router.push("/dashboard/settings"); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-4 p-4 text-gray-500 hover:text-[#3730A3] hover:bg-gray-50 rounded-2xl font-bold transition-all"
                    >
                      <User size={20} /> My Profile
                    </button>
                    
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="w-full flex items-center justify-between p-4 text-gray-500 hover:text-[#3730A3] hover:bg-gray-50 rounded-2xl font-bold transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#10B981]' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    <hr className="border-gray-50 my-2" />
                    
                    <button 
                      onClick={() => { logout(); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-2xl font-bold transition-all"
                    >
                      <LogOut size={20} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Existing Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="xl:col-span-2 bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-indigo-100/50 border border-gray-50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="flex justify-between items-center mb-12 relative z-10">
              <h3 className="text-3xl font-black text-[#1F2937]">Interest Spectrum</h3>
              <div className="px-6 py-2 bg-emerald-100 text-[#059669] rounded-2xl text-xs font-black uppercase tracking-widest">Engine Active</div>
            </div>
            
            <div className="h-[450px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#E2E8F0" strokeWidth={2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 14, fontWeight: 800 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="User Profile" dataKey="value" stroke="#4F46E5" strokeWidth={4} fill="#10B981" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="space-y-10">
            <motion.div 
               whileHover={{ y: -10, scale: 1.02 }}
               className="bg-gradient-to-br from-[#3730A3] to-[#4F46E5] p-12 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-colors" />
              <div className="relative z-10">
                <div className="bg-white/20 w-fit p-5 rounded-[1.5rem] mb-8 shadow-inner"><Target size={32} /></div>
                <h3 className="text-3xl font-black mb-3">Dominant Trait</h3>
                <h4 className="text-[#10B981] text-3xl font-black mb-8 uppercase tracking-tighter flex items-center gap-3">
                  <Sparkles size={28} /> {data.assessment.top_trait}
                </h4>
                <p className="text-indigo-100 text-lg font-medium leading-relaxed opacity-90">
                  Your profile suggests a natural aptitude for <span className="text-white font-bold">{data.assessment.top_trait}</span> environments.
                </p>
              </div>
            </motion.div>

            <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-black text-[#1F2937] text-xl">Course Progress</h4>
                <TrendingUp className="text-[#10B981]" size={24} />
              </div>
              <div className="space-y-6">
                <div className="flex justify-between font-black text-sm text-gray-400 uppercase tracking-widest">
                  <span>Journey Status</span>
                  <span className="text-[#3730A3]">{Math.round(data.roadmap?.completion_percentage || 0)}%</span>
                </div>
                <div className="h-6 w-full bg-gray-50 rounded-full overflow-hidden p-1.5 border border-gray-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data.roadmap?.completion_percentage || 0}%` }}
                    transition={{ type: "spring", bounce: 0.4, duration: 1.5 }}
                    className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {data.roadmap && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 bg-white rounded-[4rem] p-12 lg:p-16 border border-gray-50 shadow-2xl mb-32"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-indigo-50 text-[#3730A3] rounded-[2rem] shadow-sm transform -rotate-6"><Award size={40} /></div>
                <div>
                  <h3 className="text-4xl font-black text-[#1F2937] leading-none mb-3">{data.roadmap.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-emerald-50 text-[#10B981] rounded-full text-xs font-black uppercase tracking-tighter">Verified Path</span>
                    <span className="text-gray-400 font-bold text-sm">Target: {data.roadmap.duration}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {data.roadmap.milestones.map((step: any, index: number) => (
                <motion.div 
                  key={step.id}
                  whileHover={{ y: -12, scale: 1.02 }}
                  onClick={() => setSelectedMilestone(step)}
                  className={`cursor-pointer group relative p-12 rounded-[3.5rem] border-2 transition-all shadow-sm hover:shadow-2xl ${
                    step.is_completed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-[#FBFBFF] border-transparent hover:border-[#3730A3]'
                  }`}
                >
                  <motion.button 
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => handleToggleMilestone(e, step.id)}
                    className={`absolute -top-6 -right-6 w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all z-20 ${
                      step.is_completed ? 'bg-[#10B981] text-white rotate-0' : 'bg-white text-gray-200 border border-gray-100 hover:text-[#3730A3]'
                    }`}
                  >
                    <CheckCircle2 size={32} />
                  </motion.button>
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#3730A3] text-white flex items-center justify-center rounded-2xl font-black text-lg shadow-lg">
                    {index + 1}
                  </div>
                  <h4 className={`text-2xl font-black mb-6 mt-4 leading-tight ${step.is_completed ? 'text-emerald-900' : 'text-[#1F2937]'}`}>
                    {step.title}
                  </h4>
                  <div className="flex items-center gap-2 font-black text-xs text-[#10B981] group-hover:gap-4 transition-all">
                    EXPLORE RESOURCES <ChevronRight size={18} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Existing Drawers & Buttons */}
      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMilestone(null)} className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-white p-12 lg:p-16 flex flex-col shadow-[-40px_0_80px_rgba(0,0,0,0.1)] rounded-l-[4rem]"
            >
              <div className="flex justify-between items-center mb-16">
                <div className="p-5 bg-indigo-50 rounded-[2rem] text-[#3730A3] shadow-inner"><BookOpen size={32} /></div>
                <button onClick={() => setSelectedMilestone(null)} className="p-4 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-3xl transition-all"><X size={36} /></button>
              </div>
              <h3 className="text-5xl font-black text-[#1F2937] mb-4 leading-none tracking-tight">{selectedMilestone.title}</h3>
              <p className="text-gray-400 font-bold mb-16 text-lg tracking-wide uppercase text-sm">Path Syllabus & Material</p>
              
              <div className="space-y-6 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                {selectedMilestone.resources?.map((res: any, i: number) => (
                  <motion.a 
                    key={i} href={res.url} target="_blank"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-8 bg-[#F8FAFC] rounded-[3rem] border-2 border-transparent hover:border-[#10B981] hover:bg-white transition-all group"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-[#1F2937] text-xl">{res.name}</span>
                      <span className="text-xs font-black text-[#10B981] uppercase tracking-[0.2em]">{res.type}</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-300 group-hover:text-[#10B981] shadow-sm transition-colors">
                      <ExternalLink size={20} />
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-gradient-to-tr from-[#3730A3] to-[#4F46E5] text-white rounded-[2rem] shadow-[0_20px_50px_rgba(55,48,163,0.3)] flex items-center justify-center z-[80] hover:shadow-indigo-500/50 transition-all border-4 border-white"
      >
        <Sparkles size={34} fill="white" />
      </motion.button>

      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center lg:justify-end lg:pr-10">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="absolute inset-0 bg-indigo-900/20 backdrop-blur-md lg:hidden"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="relative w-[95%] max-w-[450px] h-[750px] bg-white rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden"
            >
              <div className="p-8 bg-[#3730A3] text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Target size={28} /></div>
                  <div>
                    <p className="font-black text-xl leading-none">Career Mentor</p>
                    <p className="text-xs text-indigo-200 mt-2 font-bold uppercase tracking-widest">AI Context Active</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-3 rounded-2xl transition-colors"><X size={28} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FBFBFF] custom-scrollbar">
                {messages.length === 0 && (
                  <div className="text-center py-20 opacity-40">
                    <div className="w-24 h-24 bg-indigo-100 text-[#3730A3] rounded-full flex items-center justify-center mx-auto mb-6"><Sparkles size={40} /></div>
                    <p className="text-[#1F2937] font-black text-xl">I'm your {data.assessment.top_trait} Mentor.</p>
                    <p className="text-gray-500 font-bold mt-2">How can I help you today?</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-6 rounded-[2rem] font-bold text-sm lg:text-base leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#3730A3] text-white rounded-br-none shadow-indigo-200' 
                        : 'bg-white text-[#1F2937] border border-gray-100 rounded-bl-none shadow-gray-100'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex gap-2 shadow-sm">
                      <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2.5 h-2.5 bg-indigo-200 rounded-full" />
                      <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2.5 h-2.5 bg-indigo-300 rounded-full" />
                      <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2.5 h-2.5 bg-indigo-400 rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-8 bg-white border-t border-gray-50 flex gap-4">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for advice..."
                  className="flex-1 p-5 bg-gray-50 rounded-[1.5rem] outline-none focus:ring-4 ring-indigo-50 transition-all font-bold text-[#1F2937] placeholder:text-gray-300"
                />
                <button type="submit" className="p-5 bg-[#10B981] text-white rounded-[1.5rem] hover:bg-[#059669] shadow-xl shadow-emerald-100 hover:scale-105 transition-all">
                  <Send size={24} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}