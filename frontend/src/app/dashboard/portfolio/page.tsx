"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { ExternalLink, Briefcase, Calendar, CheckCircle, ArrowLeft, FolderGit2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PortfolioPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get("assessments/portfolio/");
        setProjects(res.data.projects);
      } catch (err) {
        toast.error("Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-12 font-sans transition-colors duration-500">
      <header className="mb-16">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors font-bold mb-8">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <h1 className="text-5xl font-black text-[#1F2937] dark:text-white tracking-tight flex items-center gap-4">
          Project Showcase <FolderGit2 className="text-indigo-600" size={48} />
        </h1>
        <p className="text-gray-500 text-xl font-medium mt-2">A verified gallery of your technical accomplishments.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.length > 0 ? projects.map((project, idx) => (
          <motion.div 
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Briefcase size={24} />
              </div>
              <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={12} /> Verified
              </span>
            </div>
            
            <h3 className="text-2xl font-black dark:text-white mb-4">{project.milestone_title}</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                <Calendar size={16} /> Completed {new Date(project.completion_date).toLocaleDateString()}
              </div>
              {project.mentor_notes && (
                <div className="p-5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 italic text-gray-500 text-sm leading-relaxed">
                  "{project.mentor_notes}"
                </div>
              )}
            </div>

            <a 
              href={project.project_url} 
              target="_blank" 
              className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-[#3730A3] text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              View Repository <ExternalLink size={18} />
            </a>
          </motion.div>
        )) : (
          <div className="col-span-2 py-32 text-center bg-white dark:bg-[#1E293B] rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
             <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                <FolderGit2 size={40} />
             </div>
             <p className="text-gray-400 font-black text-xl italic">Finish your first milestone to start your portfolio!</p>
          </div>
        )}
      </div>
    </div>
  );
}