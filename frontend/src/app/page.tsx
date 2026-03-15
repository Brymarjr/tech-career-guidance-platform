"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, Users, Target, ShieldCheck, Zap, 
  MessageSquare, ChevronRight, Award, BookOpen 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      title: "AI-Powered Career Mapping",
      desc: "Our interest spectrum engine analyzes your traits to build a personalized roadmap.",
      icon: <Target className="text-indigo-600" size={24} />,
    },
    {
      title: "Expert Mentorship",
      desc: "Connect directly with industry veterans who guide your milestone submissions.",
      icon: <Users className="text-emerald-500" size={24} />,
    },
    {
      title: "Gamified Growth",
      desc: "Earn XP, unlock badges, and climb the leaderboard as you master new skills.",
      icon: <Zap className="text-amber-500" size={24} />,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] selection:bg-indigo-100 transition-colors duration-500">
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <TrendingUp size={22} />
            </div>
            <span className="text-xl font-black dark:text-white uppercase tracking-tighter">
              TechPath <span className="text-indigo-600">Pro</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-all">
              Log In
            </Link>
            <Link href="/register" className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-105 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest">
              The Future of Tech Education
            </span>
            <h1 className="mt-8 text-6xl md:text-8xl font-black text-[#1F2937] dark:text-white tracking-tighter leading-[0.9]">
              Bridge the Gap From <br />
              <span className="text-indigo-600">Learning to Earning.</span>
            </h1>
            <p className="mt-8 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
              A comprehensive career acceleration platform. Get a roadmap, find a mentor, 
              and build a professional portfolio that speaks for itself.
            </p>
            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => router.push('/register')}
                className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-indigo-200 dark:shadow-none hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Start Your Journey <ChevronRight />
              </button>
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-[#0F172A] bg-gray-200 flex items-center justify-center font-bold text-xs">
                    U{i}
                  </div>
                ))}
                <div className="pl-6 flex flex-col items-start justify-center">
                  <p className="text-sm font-black dark:text-white leading-none">500+ Students</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Joined this week</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURE GRID --- */}
      <section className="py-24 bg-gray-50/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-800 group hover:border-indigo-500 transition-all"
              >
                <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black dark:text-white mb-4">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA / CONTACT SECTION --- */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto bg-indigo-600 rounded-[4rem] p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 relative z-10">
            Ready to define your path?
          </h2>
          <p className="text-indigo-100 text-lg font-medium mb-12 relative z-10">
            Join the community today and get matched with a mentor who fits your interest spectrum.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 relative z-10">
            <button 
              onClick={() => router.push('/register')}
              className="px-12 py-5 bg-white text-indigo-600 font-black text-lg rounded-[1.5rem] shadow-xl hover:scale-105 transition-all"
            >
              Sign Up Now
            </button>
            <Link href="mailto:techpathpro@gmail.com" className="px-12 py-5 bg-indigo-700 text-white font-black text-lg rounded-[1.5rem] hover:bg-indigo-800 transition-all">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <TrendingUp size={20} />
            <span className="font-black uppercase tracking-tighter dark:text-white">TechPath Pro</span>
          </div>
          <p className="text-gray-400 text-sm font-bold">
            © 2026 TechPath Pro. All rights reserved. 
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-gray-400 hover:text-indigo-600 font-bold text-sm">Privacy</Link>
            <Link href="#" className="text-gray-400 hover:text-indigo-600 font-bold text-sm">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}