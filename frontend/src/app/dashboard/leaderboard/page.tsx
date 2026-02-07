"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, ArrowLeft, Star, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("assessments/leaderboard/");
        setLeaders(res.data);
      } catch (err) {
        toast.error("Failed to load rankings");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} className="w-12 h-12 border-4 border-[#3730A3] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-12 font-sans transition-colors duration-500">
      <header className="mb-16">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-[#3730A3] dark:hover:text-white transition-colors font-bold mb-8">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl font-black text-[#1F2937] dark:text-white tracking-tight mb-2 flex items-center gap-4">
            Global Rankings <Crown className="text-amber-500" size={48} />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">
            See how you stack up against the top <span className="text-[#3730A3] dark:text-indigo-400 font-bold">TechPath Pro</span> learners.
          </p>
        </motion.div>
      </header>

      {/* TOP 3 PODIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-end">
        {leaders.slice(0, 3).map((user, idx) => {
          const colors = [
            "border-amber-400 bg-amber-50 dark:bg-amber-900/10", // 1st
            "border-slate-300 bg-slate-50 dark:bg-slate-900/10", // 2nd
            "border-orange-300 bg-orange-50 dark:bg-orange-900/10" // 3rd
          ];
          const heights = ["h-80", "h-72", "h-64"];
          const icons = [<Crown key="1" size={40} className="text-amber-500" />, <Medal key="2" size={40} className="text-slate-400" />, <Medal key="3" size={40} className="text-orange-400" />];

          return (
            <motion.div 
              key={user.username}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative flex flex-col items-center justify-center p-8 rounded-[3.5rem] border-2 shadow-xl ${colors[idx]} ${heights[idx]} order-${idx === 0 ? 2 : idx === 1 ? 1 : 3}`}
            >
              <div className="absolute -top-6 bg-white dark:bg-[#1E293B] p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800">
                {icons[idx]}
              </div>
              <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4">
                {user.username[0].toUpperCase()}
              </div>
              <h3 className="text-xl font-black dark:text-white truncate w-full text-center">{user.username}</h3>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{user.top_trait} Specialty</p>
              <div className="mt-6 flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm">
                <Zap size={16} className="text-amber-500 fill-amber-500" />
                <span className="font-black text-indigo-600 dark:text-indigo-400">{user.xp} XP</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* LIST VIEW (Rank 4-10) */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[3.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        {leaders.slice(3).map((user, idx) => (
          <div 
            key={user.username} 
            className={`p-8 flex items-center justify-between transition-colors ${idx !== leaders.slice(3).length - 1 ? 'border-b border-gray-50 dark:border-slate-800' : ''}`}
          >
            <div className="flex items-center gap-8">
              <span className="text-2xl font-black text-gray-300 w-8"># {idx + 4}</span>
              <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-gray-500">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <h4 className="font-black dark:text-white">{user.username}</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Level {user.level}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black tracking-widest">
                {user.top_trait}
              </span>
              <span className="text-xl font-black text-[#1F2937] dark:text-white">{user.xp} <span className="text-gray-300 text-sm">XP</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}