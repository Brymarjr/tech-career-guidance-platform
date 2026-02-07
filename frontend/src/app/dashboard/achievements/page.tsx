"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Trophy, Lock, Star, ArrowLeft, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import BadgeIcon from "@/components/BadgeIcon";
import { toast } from "sonner";

export default function AchievementsPage() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await api.get("assessments/achievements-list/");
        setAchievements(res.data);
      } catch (err) {
        toast.error("Could not load achievements");
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center"><motion.div animate={{ rotate: 360 }} className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;

  const earnedCount = achievements.filter(a => a.is_earned).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-12 font-sans transition-colors duration-500">
      <header className="mb-16">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-amber-600 dark:hover:text-white transition-colors font-bold mb-8">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-black text-[#1F2937] dark:text-white tracking-tight mb-2 flex items-center gap-4">
              Hall of Fame <Trophy className="text-amber-500" size={48} />
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">
              You have unlocked <span className="text-amber-600 font-black">{earnedCount}</span> of {achievements.length} achievements.
            </p>
          </motion.div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {achievements.map((ach, idx) => (
          <motion.div
            key={ach.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`relative p-8 rounded-[3rem] border-2 transition-all group ${
              ach.is_earned 
                ? 'bg-white dark:bg-[#1E293B] border-amber-100 dark:border-amber-900/30 shadow-xl' 
                : 'bg-gray-50 dark:bg-slate-900/50 border-transparent opacity-60'
            }`}
          >
            {!ach.is_earned && <Lock className="absolute top-6 right-6 text-gray-300" size={20} />}
            
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 mx-auto transition-transform group-hover:scale-110 group-hover:rotate-3 ${
              ach.is_earned ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 shadow-inner' : 'bg-gray-200 dark:bg-slate-800 text-gray-400 grayscale'
            }`}>
              <BadgeIcon name={ach.badge_icon} size={48} />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black text-[#1F2937] dark:text-white mb-2">{ach.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed">{ach.description}</p>
            </div>

            {ach.is_earned && (
              <div className="mt-6 pt-6 border-t border-amber-50 dark:border-slate-800 flex justify-center items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest">
                <Star size={14} fill="currentColor" /> {ach.points} XP Earned
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}