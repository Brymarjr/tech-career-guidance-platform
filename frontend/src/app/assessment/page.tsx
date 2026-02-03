"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Check, X, Sparkles, Rocket, Brain, Target, Compass, Palette, Briefcase } from "lucide-react";

// Initial set of questions mapping to RIASEC types
const QUESTIONS = [
  { id: 1, text: "I like to work on cars or mechanical equipment.", type: "R" },
  { id: 2, text: "I enjoy solving complex math or science problems.", type: "I" },
  { id: 3, text: "I like to write stories, poems, or plays.", type: "A" },
  { id: 4, text: "I enjoy helping people solve their problems.", type: "S" },
  { id: 5, text: "I like to lead projects and give directions.", type: "E" },
  { id: 6, text: "I am good at keeping records and organizing data.", type: "C" },
];

export default function Assessment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ type: string; value: number }[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState<any>(null);
  const router = useRouter();

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, { type: QUESTIONS[currentStep].type, value }];
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAssessment(newAnswers);
    }
  };

  const submitAssessment = async (finalAnswers: any) => {
    try {
      // This will now succeed because our API interceptor attaches the JWT token
      const response = await api.post("assessments/submit/", { answers: finalAnswers });
      setResults(response.data);
      setIsFinished(true);
      toast.success("Analysis Complete! Your career path is ready.");
    } catch (error: any) {
      console.error("Submission error:", error.response?.status);
      toast.error("Session expired or connection lost. Please login again.");
    }
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  // View shown after successful submission
  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-[#3730A3] to-emerald-900 p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md text-center border border-white/20"
        >
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-flex p-5 bg-emerald-100 text-[#10B981] rounded-full mb-6"
          >
            <Sparkles size={48} />
          </motion.div>
          <h2 className="text-4xl font-black text-[#3730A3] mb-4">You are {results?.top_trait}!</h2>
          <p className="text-gray-600 mb-8 font-medium leading-relaxed">
            Your RIASEC profile has been analyzed and saved to your permanent record.
          </p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/dashboard")} 
            className="w-full bg-[#10B981] text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all text-lg"
          >
            View My Roadmap
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-[#3730A3] to-emerald-900 p-6">
      
      {/* Explicit Emerald Progress Bar Section */}
      <div className="w-full max-w-xl mb-12">
        <div className="flex justify-between items-end mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
              <Target size={18} className="text-[#10B981]" />
            </div>
            <span className="text-white text-xs font-black uppercase tracking-widest">Profiling in progress</span>
          </div>
          <span className="text-white text-sm font-black">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden backdrop-blur-xl border border-white/10 p-1">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
            className="bg-[#10B981] h-full rounded-full shadow-[0_0_20px_rgba(16,185,129,0.6)]" 
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 60, opacity: 0, scale: 0.9 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -60, opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-xl bg-white rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] p-12 md:p-20 border border-white/20 text-center relative overflow-hidden"
        >
          {/* Decorative Background Icon */}
          <div className="absolute -top-6 -left-6 text-gray-50 opacity-50">
             {QUESTIONS[currentStep].type === 'R' && <Briefcase size={120} />}
             {QUESTIONS[currentStep].type === 'I' && <Brain size={120} />}
             {QUESTIONS[currentStep].type === 'A' && <Palette size={120} />}
             {QUESTIONS[currentStep].type === 'S' && <Compass size={120} />}
             {QUESTIONS[currentStep].type === 'E' && <Rocket size={120} />}
             {QUESTIONS[currentStep].type === 'C' && <Target size={120} />}
          </div>
          
          <div className="relative z-10">
            <span className="bg-emerald-50 text-[#10B981] px-4 py-1.5 rounded-full font-black text-xs tracking-widest uppercase mb-8 inline-block">
              Question {currentStep + 1} of {QUESTIONS.length}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-16 leading-tight">
              {QUESTIONS[currentStep].text}
            </h2>

            <div className="grid grid-cols-2 gap-8">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#FEF2F2" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(0)}
                className="flex items-center justify-center gap-4 p-7 rounded-3xl border-2 border-gray-100 bg-gray-50 text-gray-500 font-black hover:border-red-200 hover:text-red-500 transition-all shadow-sm"
              >
                <X size={32} /> NO
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#059669" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(1)}
                className="flex items-center justify-center gap-4 p-7 rounded-3xl bg-[#10B981] text-white font-black shadow-2xl shadow-emerald-500/40 transition-all"
              >
                <Check size={32} /> YES
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}