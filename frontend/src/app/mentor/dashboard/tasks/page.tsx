"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Award, Clock, CheckCircle2, 
  MessageCircle, Loader2, Zap, LayoutDashboard, ChevronLeft,
  Search, Filter, User, Check, X, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function MentorTasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  
  // Per-task states for feedback and individual loading
  const [taskFeedback, setTaskFeedback] = useState<{ [key: number]: string }>({});
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [taskRes, threadRes] = await Promise.all([
        api.get('users/tasks/'),
        api.get('users/threads/')
      ]);
      setTasks(taskRes.data);
      setThreads(threadRes.data);
    } catch (err) {
      console.error("Task management sync error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTask = async (taskId: number, status: string) => {
    const feedback = taskFeedback[taskId] || "";
    
    if ((status === 'REJECTED' || status === 'REDO') && !feedback.trim()) {
      return toast.error("Feedback is required for rejection.");
    }

    setProcessingId(taskId);
    try {
      await api.patch(`users/tasks/${taskId}/update/`, { 
        status, 
        mentor_feedback: feedback 
      });
      
      toast.success(status === 'APPROVED' ? 'XP Authorized!' : 'Revision request sent.');
      
      // Clear feedback for this task
      setTaskFeedback(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      
      fetchData();
    } catch (err) { 
      toast.error("Action failed."); 
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === "ALL" || t.status === filter;
    const matchesSearch = t.student_username.toLowerCase().includes(search.toLowerCase()) || 
                          t.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#0F172A]">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-8 lg:p-12 transition-colors duration-500">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button onClick={() => router.push('/mentor/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold text-sm mb-4 transition-colors">
            <ChevronLeft size={18} /> Back to Hub
          </button>
          <h1 className="text-4xl font-black text-[#1F2937] dark:text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">Task Management</h1>
          <p className="text-gray-500 font-medium mt-2">Oversee assignments, verify completions, and distribute XP rewards.</p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search student or task..." 
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 ring-indigo-500 transition-all font-bold text-sm dark:text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        
        {/* FILTERS & STATS SIDEBAR */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-gray-50 dark:border-slate-800 shadow-sm">
                <h3 className="font-black dark:text-white mb-6 flex items-center gap-2"><Filter size={18} className="text-indigo-500" /> Filter View</h3>
                <div className="space-y-2">
                    {['ALL', 'PENDING', 'COMPLETED', 'APPROVED', 'REJECTED'].map((status) => (
                        <button 
                            key={status} 
                            onClick={() => setFilter(status)}
                            className={`w-full text-left px-5 py-3 rounded-xl font-bold text-xs transition-all ${filter === status ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                <Zap className="absolute right-[-20px] top-[-20px] size-32 opacity-10" />
                <h3 className="text-xl font-black mb-4 relative z-10">Assign Task</h3>
                <p className="text-indigo-100 text-xs font-medium mb-6 relative z-10">Assign new tasks directly to your mentees via chat.</p>
                <div className="space-y-2 relative z-10">
                    {threads.map((t) => (
                        <button 
                            key={t.id} 
                            onClick={() => router.push(`/dashboard/messages?thread=${t.id}`)}
                            className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group"
                        >
                            <span className="text-xs font-bold truncate">@{t.other_user.username}</span>
                            <MessageCircle size={14} className="group-hover:scale-110 transition-transform" />
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* MAIN TASK LIST */}
        <div className="xl:col-span-3 space-y-6">
            <AnimatePresence mode="popLayout">
                {filteredTasks.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#1E293B] p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100 dark:border-slate-800">
                        <Target className="mx-auto text-gray-200 mb-4" size={64} />
                        <p className="text-gray-400 font-black">No matching assignments found.</p>
                    </motion.div>
                ) : (
                    filteredTasks.map((task) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={task.id} 
                            className="p-8 bg-white dark:bg-[#1E293B] rounded-[3rem] border border-gray-50 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full flex items-center gap-2">
                                                <User size={12} className="text-indigo-500" />
                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">@{task.student_username}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest ${
                                                task.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                                                task.status === 'COMPLETED' ? 'bg-blue-100 text-blue-600 animate-pulse' : 
                                                task.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black dark:text-white leading-tight mb-2">{task.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4 line-clamp-2">{task.description}</p>
                                        <div className="flex items-center gap-6">
                                            <span className="text-emerald-500 font-black text-sm flex items-center gap-2">
                                                <Award size={18} /> +{task.xp_reward} XP
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-700 font-black text-xs flex items-center gap-2">
                                                <Clock size={16} /> {new Date(task.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-none border-gray-50 dark:border-slate-800">
                                        {task.status === 'COMPLETED' ? (
                                            <div className="flex flex-col gap-3">
                                                <button 
                                                    onClick={() => handleUpdateTask(task.id, 'APPROVED')} 
                                                    disabled={processingId !== null}
                                                    className="w-full lg:w-64 bg-[#10B981] hover:bg-[#059669] text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    {processingId === task.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Authorize XP
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateTask(task.id, 'REJECTED')} 
                                                    disabled={processingId !== null}
                                                    className="w-full lg:w-64 bg-red-50 dark:bg-red-900/10 text-red-500 py-4 rounded-2xl font-black text-xs uppercase transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    {processingId === task.id ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />} Request Changes
                                                </button>
                                            </div>
                                        ) : task.status === 'APPROVED' ? (
                                            <div className="flex items-center gap-3 text-emerald-500 font-black uppercase text-[10px] tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 rounded-2xl">
                                                <Check size={18} /> Points Granted
                                            </div>
                                        ) : (
                                            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800 text-gray-400 font-black text-[10px] uppercase rounded-2xl text-center">
                                                Awaiting Submission
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Feedback Section */}
                                {task.status === 'COMPLETED' && (
                                    <div className="pt-4 border-t border-gray-50 dark:border-slate-800">
                                        <textarea
                                            placeholder="Provide feedback or instructions for revision..."
                                            value={taskFeedback[task.id] || ""}
                                            onChange={(e) => setTaskFeedback({...taskFeedback, [task.id]: e.target.value})}
                                            className="w-full p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20 dark:text-white resize-none"
                                            rows={2}
                                        />
                                    </div>
                                )}
                                
                                {task.mentor_feedback && task.status !== 'COMPLETED' && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl flex gap-3 items-start border border-amber-100 dark:border-amber-900/20">
                                        <AlertCircle size={18} className="text-amber-500 mt-1" />
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed italic">"{task.mentor_feedback}"</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}