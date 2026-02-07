"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target, Trophy, Rocket, ChevronRight, X } from "lucide-react";
import api from "@/lib/api";

export default function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to TechPath Pro",
      desc: "Your journey to an optimized career starts here. We've analyzed your traits to build a custom path just for you.",
      icon: <Sparkles className="text-indigo-500" size={40} />,
      color: "bg-indigo-50"
    },
    {
      title: "Master Your Roadmap",
      desc: "Complete milestones to gain skills. Each milestone requires a project submission that a mentor will verify.",
      icon: <Target className="text-emerald-500" size={40} />,
      color: "bg-emerald-50"
    },
    {
      title: "Earn XP & Badges",
      desc: "Level up by completing work. Unlock exclusive badges and climb the global leaderboard to show your expertise.",
      icon: <Trophy className="text-amber-500" size={40} />,
      color: "bg-amber-50"
    }
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      await api.post("users/complete-onboarding/");
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0F172A]/80 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800"
      >
        <div className={`p-12 ${steps[step].color} dark:bg-slate-900/50 flex justify-center transition-colors duration-500`}>
          <motion.div 
            key={step}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl"
          >
            {steps[step].icon}
          </motion.div>
        </div>

        <div className="p-12 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <h2 className="text-3xl font-black dark:text-white mb-4">{steps[step].title}</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-10">
                {steps[step].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200 dark:bg-slate-700'}`} />
              ))}
            </div>
            
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-4 bg-[#111827] dark:bg-indigo-600 text-white rounded-2xl font-black hover:scale-105 transition-all"
            >
              {step === steps.length - 1 ? "Get Started" : "Next"} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}