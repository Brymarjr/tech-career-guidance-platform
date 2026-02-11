"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, BookOpen, ChevronRight, X, ExternalLink, 
  CheckCircle2, Send, Link, ClipboardList, Loader2, Sparkles, ArrowLeft,
  Video, FileText, PlayCircle
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CareerRoadmapPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  const fetchRoadmap = async (silent = false) => {
    try {
      const res = await api.get("assessments/dashboard-summary/");
      setData(res.data);
    
      // Update the selected milestone data if the drawer is open
      if (selectedMilestone) {
        const updatedMilestone = res.data.roadmap.milestones.find(
          (m: any) => m.id === selectedMilestone.id
        );
        if (updatedMilestone) setSelectedMilestone(updatedMilestone);
      }
    } catch (err) {
      if (!silent) toast.error("Failed to load roadmap");
    }
  };

  useEffect(() => {
    if (user && user.loggedIn) {
      fetchRoadmap();
    }
  }, [user]);

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionUrl) return toast.error("Link is required");
    
    setSubmitting(true);
    try {
      await api.post(`assessments/milestone/${selectedMilestone.id}/submit/`, {
        submission_url: submissionUrl,
        notes: submissionNotes
      });
      toast.success("Submitted for mentor review!");
      setSubmissionUrl("");
      setSubmissionNotes("");
    
      // OPTIMIZATION: Call fetchRoadmap(true) to update UI without a full reload/flicker
      await fetchRoadmap(true);

      setSelectedMilestone(null);

    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#3730A3]" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-12 transition-colors duration-500 font-sans">
      <header className="mb-12">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#3730A3] dark:hover:text-white transition-colors font-bold mb-6"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-6">
          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 text-[#3730A3] dark:text-indigo-400 rounded-[2rem] shadow-sm transform -rotate-6">
            <Award size={40} />
          </div>
          <div>
            <h1 className="text-5xl font-black text-[#1F2937] dark:text-white tracking-tight mb-2">
              {data.roadmap?.title || "Career Roadmap"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-xl">
              Target duration: <span className="text-[#3730A3] dark:text-indigo-400 font-bold">{data.roadmap?.duration}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 mb-12 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-black text-gray-400 uppercase tracking-widest text-sm">Overall Journey Progress</h4>
          <span className="text-2xl font-black text-[#10B981]">{Math.round(data.roadmap?.completion_percentage || 0)}%</span>
        </div>
        <div className="h-4 w-full bg-gray-50 dark:bg-slate-900 rounded-full overflow-hidden p-1">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${data.roadmap?.completion_percentage || 0}%` }} 
            className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.roadmap?.milestones.sort((a:any, b:any) => a.order - b.order).map((step: any, index: number) => {
          const statusColors: any = {
            'COMPLETED': 'border-emerald-100 bg-emerald-50/50 dark:bg-emerald-900/10',
            'PENDING_REVIEW': 'border-amber-100 bg-amber-50/50 dark:bg-amber-900/10',
            'REJECTED': 'border-red-100 bg-red-50/50 dark:bg-red-900/10',
            'IN_PROGRESS': 'bg-white dark:bg-[#1E293B] border-transparent'
          };

          return (
            <motion.div 
              key={step.id} 
              whileHover={{ y: -10 }} 
              onClick={() => setSelectedMilestone(step)} 
              className={`cursor-pointer relative p-10 rounded-[3.5rem] border-2 transition-all shadow-sm hover:shadow-xl ${statusColors[step.status] || statusColors['IN_PROGRESS']}`}
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#3730A3] text-white flex items-center justify-center rounded-2xl font-black shadow-lg">{step.order || index + 1}</div>
              <h4 className="text-2xl font-black dark:text-white mt-4 mb-4">{step.title}</h4>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  step.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-600' :
                  step.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                  step.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {step.status.replace('_', ' ')}
                </span>
                {step.resources?.length > 0 && (
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-[#3730A3] dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <BookOpen size={10} /> {step.resources.length} Lessons
                  </span>
                )}
              </div>
              <div className="mt-8 flex items-center gap-2 font-black text-xs text-[#10B981]">VIEW CONTENT & SUBMIT <ChevronRight size={16} /></div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMilestone(null)} className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: "spring", damping: 30 }} 
              className="relative w-full max-w-xl h-full bg-white dark:bg-[#0F172A] p-12 flex flex-col shadow-2xl rounded-l-none"
            >
              
              <div className="flex justify-between items-center mb-10">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-[#3730A3]"><ClipboardList size={28} /></div>
                <button onClick={() => setSelectedMilestone(null)} className="p-4 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-2xl transition-all"><X size={32} /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                <div>
                  <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.2em]">Step {selectedMilestone.order}</span>
                  <h3 className="text-4xl font-black dark:text-white mt-2">{selectedMilestone.title}</h3>
                </div>
                
                {selectedMilestone.feedback && (
                  <div className="p-6 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-[2rem]">
                    <h4 className="text-red-600 font-black text-xs uppercase mb-2 flex items-center gap-2"><Sparkles size={14} /> Mentor Feedback</h4>
                    <p className="text-red-800 dark:text-red-300 italic">"{selectedMilestone.feedback}"</p>
                  </div>
                )}

                <section>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <PlayCircle size={16} /> Curated Learning Materials
                  </h4>
                  <div className="space-y-4">
                    {selectedMilestone.resources && selectedMilestone.resources.length > 0 ? (
                      selectedMilestone.resources.map((res: any, i: number) => (
                        <a 
                          key={i} 
                          href={res.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-900/50 rounded-[2rem] border border-transparent hover:border-[#10B981] dark:hover:border-[#10B981] transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                              {res.resource_type === 'VIDEO' ? <Video size={20} /> : res.resource_type === 'DOC' ? <FileText size={20} /> : <BookOpen size={20} />}
                            </div>
                            <div>
                              <p className="font-bold dark:text-white leading-tight">{res.title || res.name}</p>
                              <p className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-tighter">{res.resource_type}</p>
                            </div>
                          </div>
                          <ExternalLink size={18} className="text-gray-300 group-hover:text-[#10B981] transition-colors" />
                        </a>
                      ))
                    ) : (
                      <div className="p-10 bg-gray-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-800 text-center">
                        <BookOpen className="mx-auto text-gray-300 mb-4" size={32} />
                        <p className="text-gray-400 font-bold italic">Mentor is curating resources for this step.</p>
                      </div>
                    )}
                  </div>
                </section>

                <hr className="border-gray-100 dark:border-slate-800 my-8" />

                {selectedMilestone.status !== 'COMPLETED' && selectedMilestone.status !== 'PENDING_REVIEW' ? (
                  <form onSubmit={handleSubmitWork} className="p-8 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[3rem] border-2 border-indigo-50 dark:border-indigo-900/20 space-y-6">
                    <h4 className="text-xl font-black dark:text-white flex items-center gap-2">
                      <Send size={20} className="text-[#3730A3]" /> Submit Your Work
                    </h4>
                    <input 
                      type="url" 
                      placeholder="Project Link (GitHub, Drive, URL)" 
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl outline-none border-2 border-transparent focus:border-[#3730A3] dark:text-white font-bold"
                      required
                    />
                    <textarea 
                      placeholder="Share notes or questions for your mentor..."
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl outline-none border-2 border-transparent focus:border-[#3730A3] dark:text-white font-bold resize-none"
                      rows={3}
                    />
                    <button disabled={submitting} className="w-full py-5 bg-[#3730A3] text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform">
                      {submitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                      {submitting ? 'Sending...' : 'Send for Review'}
                    </button>
                  </form>
                ) : (
                  <div className={`p-10 text-center rounded-[3rem] border-2 ${selectedMilestone.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30'}`}>
                    {selectedMilestone.status === 'COMPLETED' ? <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} /> : <Loader2 className="mx-auto text-amber-500 animate-spin mb-4" size={48} />}
                    <h4 className={`text-xl font-black ${selectedMilestone.status === 'COMPLETED' ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400'}`}>
                      {selectedMilestone.status === 'COMPLETED' ? 'Milestone Verified' : 'Awaiting Review'}
                    </h4>
                    <p className="text-sm font-medium text-gray-500 mt-2">
                      {selectedMilestone.status === 'COMPLETED' ? 'You have successfully mastered this step!' : 'Your mentor will notify you once reviewed.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}