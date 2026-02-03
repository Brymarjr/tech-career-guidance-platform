"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from "recharts";
import { 
  LayoutDashboard, Award, BookOpen, ChevronRight, 
  User, LogOut, Target, Sparkles, TrendingUp, X, ExternalLink 
} from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("assessments/dashboard-summary/");
        setData(res.data);
        
        if (res.data.assessment && res.data.assessment.scores) {
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

          let completion = 50; 
          if (res.data.user.role) completion += 25;
          if (res.data.assessment.top_trait) completion += 25;
          setProfileCompletion(completion);
        }
      } catch (err) {
        console.error("Dashboard load failed", err);
      }
    };
    fetchDashboard();
  }, []);

  if (!data) return (
    <div className="min-h-screen bg-[#3730A3] flex items-center justify-center">
       <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex relative overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-gray-200 p-8 hidden lg:flex flex-col">
        <div className="mb-12 flex items-center gap-2">
          <div className="w-10 h-10 bg-[#3730A3] rounded-xl flex items-center justify-center text-white font-black text-xl">T</div>
          <span className="text-2xl font-black text-[#1F2937] tracking-tight">TechPath</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          <div className="flex items-center gap-3 p-4 bg-indigo-50 text-[#3730A3] rounded-2xl font-black shadow-sm">
            <LayoutDashboard size={22} /> Dashboard
          </div>
          <div className="flex items-center gap-3 p-4 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all cursor-pointer">
            <Award size={22} /> My Roadmap
          </div>
        </nav>

        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 p-4 text-red-500 font-bold cursor-pointer hover:bg-red-50 rounded-2xl transition-all">
            <LogOut size={22} /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-[#111827] mb-2">Welcome, {data.user.username}!</h1>
            <p className="text-[#4B5563] text-lg font-semibold">
               Status: <span className="text-[#10B981]">Analysis Complete</span>
            </p>
          </motion.div>
          <div className="flex items-center gap-4 bg-white p-3 pr-8 rounded-full shadow-md border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#3730A3] to-[#10B981] rounded-full flex items-center justify-center text-white font-black shadow-lg">
              {data.user.username[0].toUpperCase()}
            </div>
            <div>
               <p className="font-black text-[#1F2937] leading-none">{data.user.username}</p>
               <p className="text-xs text-gray-400 font-bold uppercase mt-1">{data.user.role}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Interest Analysis Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100"
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-[#1F2937]">Interest Analysis</h3>
              <div className="px-4 py-2 bg-emerald-50 text-[#10B981] rounded-full text-xs font-black uppercase">RIASEC Engine</div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#E5E7EB" strokeWidth={2} />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#1F2937', fontSize: 13, fontWeight: 900 }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                  <Radar
                    name="Your Profile"
                    dataKey="value"
                    stroke="#3730A3"
                    strokeWidth={4}
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Trait & Progress Cards */}
          <div className="space-y-8">
            <motion.div 
               whileHover={{ y: -5 }}
               className="bg-[#3730A3] p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="bg-white/20 w-fit p-4 rounded-2xl mb-6"><Target size={28} /></div>
                <h3 className="text-3xl font-black mb-2 text-white">Dominant Trait</h3>
                <h4 className="text-[#10B981] text-2xl font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={24} /> {data.assessment.top_trait || "Pending"}
                </h4>
                <p className="text-indigo-100 text-lg font-medium leading-relaxed">
                  You excel in environments that reward <b>{data.assessment.top_trait}</b> skills.
                </p>
              </div>
            </motion.div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-200 shadow-sm">
              <h4 className="font-black text-[#1F2937] mb-6">Profile Completion</h4>
              <div className="space-y-4">
                <div className="flex justify-between font-black text-sm text-gray-500 uppercase">
                  <span>Progress</span>
                  <span className="text-[#3730A3]">{profileCompletion}%</span>
                </div>
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    className="h-full bg-[#10B981] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Career Roadmap Timeline */}
        {data.roadmap && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 bg-white rounded-[3rem] p-12 border border-gray-100 shadow-xl mb-20"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-50 text-[#3730A3] rounded-3xl shadow-sm"><TrendingUp size={32} /></div>
                <div>
                  <h3 className="text-3xl font-black text-[#1F2937] leading-tight uppercase tracking-tight">{data.roadmap.title}</h3>
                  <p className="text-[#10B981] font-black uppercase tracking-[0.2em] text-xs mt-1">Personalized Milestones</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.roadmap.roles.map((role: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-100">
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.roadmap.milestones.map((step: string, index: number) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedMilestone(data.roadmap.milestone_details[index])}
                  className="cursor-pointer group relative p-10 bg-[#FBFBFF] rounded-[2.5rem] border-2 border-transparent hover:border-[#3730A3] hover:bg-white transition-all shadow-sm hover:shadow-2xl"
                >
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#3730A3] text-white flex items-center justify-center rounded-2xl font-black shadow-lg transform group-hover:rotate-12 transition-transform">
                    {index + 1}
                  </div>
                  <h4 className="text-2xl font-black text-[#1F2937] mb-4 mt-2 leading-tight">{step}</h4>
                  <div className="flex items-center text-[#10B981] font-black text-sm group-hover:gap-3 transition-all">
                    VIEW RESOURCES <ChevronRight size={18} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Slide-over Resource Drawer */}
      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedMilestone(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg h-full bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] p-12 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="p-3 bg-indigo-50 rounded-2xl text-[#3730A3]"><BookOpen size={24} /></div>
                <button 
                  onClick={() => setSelectedMilestone(null)} 
                  className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
                >
                  <X size={28} />
                </button>
              </div>

              <h3 className="text-4xl font-black text-[#1F2937] mb-2 leading-tight">
                {selectedMilestone.title}
              </h3>
              <p className="text-gray-500 font-bold mb-10">Curated path for your growth.</p>

              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {selectedMilestone.resources.map((res: any, i: number) => (
                  <motion.a 
                    key={i} 
                    href={res.url} 
                    target="_blank" 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-6 bg-[#F8FAFC] rounded-3xl border-2 border-transparent hover:border-[#10B981] hover:bg-white transition-all group shadow-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-[#1F2937] text-lg">{res.name}</span>
                      <span className="text-xs font-bold text-[#10B981] uppercase mt-1">Resource</span>
                    </div>
                    <ExternalLink className="text-gray-300 group-hover:text-[#10B981] transition-colors" size={24} />
                  </motion.a>
                ))}
              </div>

              {/* DYNAMIC TARGET COMPLETION FROM BACKEND */}
              <div className="mt-10 p-6 bg-[#10B981] rounded-3xl text-white">
                <p className="font-black text-center uppercase tracking-widest text-sm">
                  Target Completion: {data.roadmap.duration || "TBD"}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}