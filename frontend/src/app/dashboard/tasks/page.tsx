"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Award, Clock, CheckCircle2, 
  MessageCircle, Loader2, Zap, Search, Filter, ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function StudentTasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchData = async () => {
    try {
      const [taskRes, threadRes] = await Promise.all([
        api.get('users/tasks/'),
        api.get('users/threads/')
      ]);
      setTasks(taskRes.data);
      setThreads(threadRes.data);
    } catch (err) {
      console.error("Task page sync error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTask = async (taskId: number, status: string) => {
    try {
      await api.patch(`users/tasks/${taskId}/update/`, { status });
      toast.success(`Task marked as ${status.toLowerCase()}!`);
      fetchData();
    } catch (err) { toast.error("Action failed."); }
  };

  // Filter & Search Logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
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
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold text-sm mb-4 transition-colors">
            <ChevronLeft size={18} /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-black text-[#1F2937] dark:text-white tracking-tight">Mission Log</h1>
          <p className="text-gray-500 font-medium mt-2">Track your assignments and claim your XP rewards.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search missions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 ring-indigo-500 font-bold text-sm dark:text-white w-full sm:w-64"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* LEFT SIDEBAR: FILTERS & PROGRESS */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-gray-50 dark:border-slate-800 shadow-sm">
            <h3 className="font-black dark:text-white mb-6 flex items-center gap-2"><Filter size={18} className="text-indigo-500" /> Filter</h3>
            <div className="space-y-2">
              {['ALL', 'PENDING', 'COMPLETED', 'APPROVED'].map((status) => (
                <button 
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`w-full text-left px-5 py-3 rounded-xl font-bold text-xs transition-all ${
                    statusFilter === status 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#3730A3] p-8 rounded-[3rem] text-white relative overflow-hidden">
            <Zap className="absolute right-[-10px] top-[-10px] size-32 opacity-10" />
            <h3 className="text-xl font-black mb-2">Need Help?</h3>
            <p className="text-indigo-200 text-xs font-medium mb-6">Message your mentor if an objective is unclear.</p>
            <div className="space-y-2">
              {threads.map((t) => (
                <button 
                  key={t.id} 
                  onClick={() => router.push(`/dashboard/messages?thread=${t.id}`)}
                  className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all text-left group"
                >
                  <span className="text-xs font-bold">@{t.other_user.username}</span>
                  <MessageCircle size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN TASK LIST AREA */}
        <div className="xl:col-span-3 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white dark:bg-[#1E293B] p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100 dark:border-slate-800"
              >
                <Clock className="mx-auto text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 font-black">No matching objectives found.</p>
              </motion.div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.98 }}
                  key={task.id} 
                  className="p-8 bg-white dark:bg-[#1E293B] rounded-[3rem] border border-gray-50 dark:border-slate-800 shadow-sm transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        task.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                        task.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {task.status}
                      </span>
                      <span className="text-indigo-500 font-black text-xs flex items-center gap-1">
                        <Award size={14} /> +{task.xp_reward} XP
                      </span>
                    </div>
                    <h3 className="text-xl font-black dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2">{task.description}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-4 tracking-widest flex items-center gap-2">
                      <Target size={12} /> Assigned by @{task.mentor_username}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {task.status === 'PENDING' && (
                      <button 
                        onClick={() => handleUpdateTask(task.id, 'COMPLETED')} 
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                      >
                        Mark Finished
                      </button>
                    )}
                    {task.status === 'COMPLETED' && (
                      <div className="flex items-center gap-2 text-indigo-500 font-black uppercase text-xs tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-6 py-4 rounded-2xl w-full md:w-auto justify-center">
                        <Clock size={16} className="animate-spin" /> Awaiting XP
                      </div>
                    )}
                    {task.status === 'APPROVED' && (
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600">
                        <CheckCircle2 size={32} />
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