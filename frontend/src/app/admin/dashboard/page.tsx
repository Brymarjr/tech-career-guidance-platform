"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserCheck, ShieldAlert, Download, Search, 
  ShieldCheck, LogOut, Sun, Moon, Database, Server, 
  ChevronLeft, ChevronRight, UserPlus, HelpCircle, Map, Plus, Trash2, X, Loader2, CheckCircle2,
  Link as LinkIcon, Video, FileText, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  const { logout, user, isDarkMode, toggleTheme } = useAuth();
  const router = useRouter();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'users' | 'questions' | 'paths'>('users');

  // Original Data States
  const [users, setUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Management States
  const [questions, setQuestions] = useState<any[]>([]);
  const [paths, setPaths] = useState<any[]>([]);
  const [selectedPath, setSelectedPath] = useState<any>(null);
  
  // UI Modal States
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isAddingPath, setIsAddingPath] = useState(false);

  // Form States (Global)
  const [newQuestion, setNewQuestion] = useState({ text: "", riasec_type: "R" });
  const [newPath, setNewPath] = useState({ title: "", trait_type: "R", duration: "12 Weeks" });
  const [newMilestone, setNewMilestone] = useState({ title: "", order: 1 });

  // FIXED: Milestone-specific resource state to prevent duplication
  // We use an object where the key is the milestone ID
  const [resourceForms, setResourceForms] = useState<{[key: number]: any}>({});

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // UI States
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAdminData = async (pageNum = 1) => {
    const token = typeof window !== "undefined" ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const [userRes, healthRes, questionRes, pathRes] = await Promise.all([
        api.get(`users/admin/users/?page=${pageNum}`),
        api.get("users/admin/health/"),
        api.get("assessments/questions/"),
        api.get("assessments/admin/paths/")
      ]);
      
      setUsers(userRes.data.results);
      setTotalCount(userRes.data.count);
      setTotalPages(Math.ceil(userRes.data.count / 10)); 
      setHealth(healthRes.data);
      setQuestions(questionRes.data);
      setPaths(pathRes.data);

      if (selectedPath) {
        const updatedPath = pathRes.data.find((p: any) => p.id === selectedPath.id);
        if (updatedPath) setSelectedPath(updatedPath);
      }
    } catch (err: any) {
      if (err.response?.status !== 401 && localStorage.getItem('access_token')) {
        toast.error("Administrative load failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    setIsUserMenuOpen(false);
    logout();
  };

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push("/dashboard");
      return;
    }
    
    fetchAdminData(page);
    
    heartbeatRef.current = setInterval(() => {
      const token = localStorage.getItem('access_token');
      if (token) {
        api.get("users/admin/health/")
          .then(res => setHealth(res.data))
          .catch(err => console.error("Health heartbeat missed"));
      }
    }, 30000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [user, page]);

  const handleUpdateUser = async (userId: string, updateData: any) => {
    try {
      await api.patch(`users/admin/users/${userId}/`, updateData);
      toast.success("User updated successfully");
      fetchAdminData(page);
    } catch (err) {
      toast.error("Operation failed.");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("assessments/questions/", newQuestion);
      toast.success("Question published");
      setIsAddingQuestion(false);
      setNewQuestion({ text: "", riasec_type: "R" });
      fetchAdminData(page);
    } catch (err) { toast.error("Error adding question"); }
  };

  const handleAddPath = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("assessments/admin/paths/", newPath);
      toast.success("Roadmap Initialized");
      setIsAddingPath(false);
      fetchAdminData(page);
    } catch (err) { toast.error("Failed to create path"); }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("assessments/admin/milestones/", { ...newMilestone, path: selectedPath.id });
      toast.success("Milestone Added");
      setNewMilestone({ title: "", order: selectedPath.milestones.length + 1 });
      fetchAdminData(page);
    } catch (err) { toast.error("Failed to add milestone"); }
  };

  const handleAddResource = async (milestoneId: number) => {
    // 1. Get the specific form data for this milestone
    const form = resourceForms[milestoneId];
    
    // 2. Validation check
    if (!form?.title || !form?.url) {
      return toast.error("Please provide both a Title and a URL");
    }

    try {
      // 3. Match the keys to your LearningResource model exactly
      await api.post("assessments/admin/resources/", { 
        milestone: milestoneId,
        title: form.title,
        url: form.url,
        resource_type: form.resource_type || "VIDEO",
        category: "Core", // Matches your model's max_length=100
        trait_alignment: selectedPath.trait_type[0] || 'R' // Matches your model's max_length=1
      });

      toast.success("Resource Attached");
      
      // 4. Clear ONLY this milestone's form inputs
      setResourceForms(prev => ({ 
        ...prev, 
        [milestoneId]: { title: "", url: "", resource_type: "VIDEO" } 
      }));

      // 5. Refresh data to show the new link in the list
      fetchAdminData(page);
    } catch (err: any) {
      console.error("Resource error details:", err.response?.data);
      toast.error("Failed to add resource. Check console for details.");
    }
  };

  const handleExportCSV = async () => {
    const token = localStorage.getItem('access_token');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/';
    try {
      toast.loading("Preparing audit log...");
      const response = await fetch(`${baseUrl}users/admin/export-audit/`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `techpath_audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("Download started!");
    } catch (err) { toast.dismiss(); toast.error("Export failed."); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#3730A3] flex items-center justify-center">
       <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
    </div>
  );

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans transition-colors duration-500 bg-[#F8FAFC] dark:bg-[#0F172A]">
      
      <aside className="w-80 bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-slate-800 p-8 hidden xl:flex flex-col shadow-sm h-screen sticky top-0 z-10 transition-colors duration-500">
        <div className="mb-12 flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-900 rounded-2xl flex items-center justify-center text-white shadow-lg transform rotate-3">
            <ShieldCheck size={26} />
          </div>
          <span className="text-2xl font-black text-[#1F2937] dark:text-white tracking-tight">Admin <span className="text-indigo-900 dark:text-indigo-400">CMD</span></span>
        </div>
        
        <nav className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-4 p-4 rounded-2xl font-black shadow-sm cursor-pointer transition-all ${activeTab === 'users' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50'}`}
          >
            <Users size={22} /> User Registry
          </div>
          <div 
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-4 p-4 rounded-2xl font-black shadow-sm cursor-pointer transition-all ${activeTab === 'questions' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50'}`}
          >
            <HelpCircle size={22} /> Assessment Bank
          </div>
          <div 
            onClick={() => setActiveTab('paths')}
            className={`flex items-center gap-4 p-4 rounded-2xl font-black shadow-sm cursor-pointer transition-all ${activeTab === 'paths' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50'}`}
          >
            <Map size={22} /> Roadmap Manager
          </div>
          <div onClick={handleExportCSV} className="flex items-center gap-4 p-4 text-gray-400 hover:text-indigo-600 dark:hover:text-[#10B981] hover:bg-emerald-50 rounded-2xl font-bold transition-all cursor-pointer">
            <Download size={22} /> Export Audit Logs
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto relative z-0">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-black text-[#111827] dark:text-white mb-3 tracking-tight">Command Center</h1>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[#6B7280] dark:text-gray-400 text-xl font-medium italic underline decoration-indigo-200">System Administrator: {user?.username}</p>
            </div>
          </motion.div>

          <div className="relative">
            <div 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
              className="flex items-center gap-5 bg-white dark:bg-[#1E293B] p-4 pr-10 rounded-[2rem] shadow-xl border border-gray-50 dark:border-slate-800 cursor-pointer hover:shadow-2xl transition-all z-50 group"
            >
              <div className="w-14 h-14 bg-indigo-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                {user?.username ? user.username[0].toUpperCase() : 'A'}
              </div>
              <div>
                 <p className="font-black text-[#1F2937] dark:text-white text-lg">{user?.username}</p>
                 <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider">Super Admin</span>
              </div>
            </div>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-4 w-72 bg-white dark:bg-[#1E293B] rounded-[2.5rem] shadow-2xl p-4 z-[100] border border-gray-50 dark:border-slate-800">
                  <div className="space-y-2">
                    <button 
                      onClick={toggleTheme} 
                      className="w-full flex items-center justify-between p-4 text-gray-500 dark:text-gray-400 hover:text-indigo-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>
                    <hr className="border-gray-50 dark:border-slate-800 my-2" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-[1.5rem] font-bold transition-all"><LogOut size={20} /> Sign Out</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-[#111827] p-8 rounded-[3rem] shadow-2xl border border-gray-800 flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-900/30 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform"><Database size={28} /></div>
              <div><p className="text-gray-500 text-xs font-black uppercase tracking-widest">Database Health</p><p className="text-white font-bold text-lg">{health?.database.status || 'Syncing...'}</p></div>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-[10px] font-black uppercase">Latency</p>
              <p className="text-[#10B981] font-mono font-bold text-xl">{health?.database.latency}</p>
            </div>
          </div>
          <div className="bg-[#111827] p-8 rounded-[3rem] shadow-2xl border border-gray-800 flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-900/30 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><Server size={28} /></div>
              <div><p className="text-gray-500 text-xs font-black uppercase tracking-widest">API Engine</p><p className="text-white font-bold text-lg">{health?.api_server.status || 'Checking...'}</p></div>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-[10px] font-black uppercase">Uptime</p>
              <p className="text-blue-400 font-mono font-bold text-xl">{health?.api_server.uptime}</p>
            </div>
          </div>
        </div>

        {activeTab === 'users' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-gray-50 transition-colors duration-500"><Users className="text-indigo-600 mb-4" size={32} /><h4 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Platform Users</h4><p className="text-5xl font-black text-[#1F2937] dark:text-white">{totalCount}</p></div>
              <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-gray-50 transition-colors duration-500"><UserCheck className="text-emerald-500 mb-4" size={32} /><h4 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Verified Mentors</h4><p className="text-5xl font-black text-[#1F2937] dark:text-white">{users.filter(u => u.role === 'MENTOR').length}</p></div>
              <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-gray-50 transition-colors duration-500"><ShieldAlert className="text-red-400 mb-4" size={32} /><h4 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Restricted</h4><p className="text-5xl font-black text-[#1F2937] dark:text-white">{users.filter(u => !u.is_active).length}</p></div>
            </div>
            <div className="bg-white dark:bg-[#1E293B] rounded-[4rem] shadow-2xl border border-gray-50 dark:border-slate-800 overflow-hidden mb-20 transition-colors duration-500">
              <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center bg-gray-50/20 dark:bg-slate-900/20 gap-6">
                <h3 className="text-3xl font-black text-[#1F2937] dark:text-white">User Registry</h3>
                <div className="relative w-full md:w-96"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} /><input type="text" placeholder="Search registry..." className="w-full pl-14 pr-8 py-4 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-[1.5rem] outline-none focus:border-indigo-500 dark:text-white font-bold transition-all shadow-inner" onChange={(e) => setSearchTerm(e.target.value)}/></div>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left">
                <thead><tr className="text-gray-400 font-black text-xs uppercase tracking-[0.2em] border-b dark:border-slate-800"><th className="p-12">Identify</th><th className="p-12">Role Assignment</th><th className="p-12">Account Status</th><th className="p-12 text-right">Actions</th></tr></thead>
                <tbody className="divide-y dark:divide-slate-800">{users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group"><td className="p-12"><div className="flex items-center gap-5"><div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 text-indigo-900 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-100 shadow-sm">{u.username[0].toUpperCase()}</div><div><p className="font-black text-[#1F2937] dark:text-white text-lg">{u.username}</p><p className="text-sm text-gray-400 font-bold">{u.email}</p></div></div></td>
                  <td><select value={u.role} onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })} className="bg-gray-50 dark:bg-slate-900 dark:text-white border-2 border-gray-100 dark:border-slate-800 rounded-2xl px-6 py-3 font-black text-sm outline-none cursor-pointer appearance-none text-[#3730A3] dark:text-indigo-400"><option value="STUDENT">Student</option><option value="MENTOR">Mentor</option><option value="ADMIN">Admin</option></select></td>
                  <td><span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></td>
                  <td className="p-12 text-right"><button onClick={() => handleUpdateUser(u.id, { is_active: !u.is_active })} className={`p-4 rounded-2xl transition-all shadow-md ${u.is_active ? 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}>{u.is_active ? <ShieldAlert size={24} /> : <UserPlus size={24} />}</button></td></tr>
                ))}</tbody>
              </table></div>
              <div className="p-10 bg-gray-50/50 dark:bg-slate-900/30 flex justify-between items-center transition-colors duration-500"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm disabled:opacity-30 font-bold dark:text-white transition-all hover:bg-indigo-50"><ChevronLeft size={20} /> Previous</button><span className="font-black dark:text-white uppercase tracking-widest text-sm text-gray-400">Page {page} of {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm disabled:opacity-30 font-bold dark:text-white transition-all hover:bg-indigo-50">Next <ChevronRight size={20} /></button></div>
            </div>
          </>
        )}

        {activeTab === 'questions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black dark:text-white">Assessment Bank</h3><button onClick={() => setIsAddingQuestion(true)} className="bg-indigo-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Plus size={24}/> New Question</button></div>
            <div className="grid gap-4">{questions.map(q => (
              <div key={q.id} className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] flex justify-between items-center shadow-lg border border-gray-100 dark:border-slate-800 group"><div className="flex items-center gap-8"><div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">{q.riasec_type}</div><p className="font-bold text-xl dark:text-white group-hover:text-indigo-600 transition-colors">{q.text}</p></div><button onClick={() => api.delete(`assessments/questions/${q.id}/`).then(() => fetchAdminData(page))} className="p-4 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2/></button></div>
            ))}</div>
          </motion.div>
        )}

        {activeTab === 'paths' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black dark:text-white">Roadmap Logic Manager</h3><button onClick={() => setIsAddingPath(true)} className="bg-indigo-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Plus size={24}/> Create Path</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{paths.map(p => (
              <div key={p.id} className="bg-white dark:bg-[#1E293B] p-10 rounded-[3.5rem] border border-gray-100 dark:border-slate-800 shadow-xl relative group">
                <div className="flex justify-between items-start mb-6"><div><span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{p.trait_type} Specialization</span><h4 className="text-2xl font-black dark:text-white mt-1">{p.title}</h4></div><div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs uppercase tracking-tighter">{p.duration}</div></div>
                <div className="space-y-3 mb-10">{p.milestones?.length > 0 ? p.milestones.map((m: any) => (<div key={m.id} className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-bold text-sm bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-transparent hover:border-indigo-100 transition-colors"><div className="w-2 h-2 bg-indigo-400 rounded-full" /> {m.title}</div>)) : <p className="text-gray-400 italic text-sm">No milestones added yet.</p>}</div>
                <button onClick={() => setSelectedPath(p)} className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black hover:bg-indigo-600 hover:text-white transition-all shadow-md">Manage Milestones +</button>
              </div>
            ))}</div>
          </motion.div>
        )}
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {isAddingQuestion && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsAddingQuestion(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" /><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-white dark:bg-[#1E293B] w-full max-w-2xl p-12 rounded-[4rem] border dark:border-slate-800 shadow-2xl"><h2 className="text-4xl font-black mb-8 dark:text-white tracking-tight">Deploy Question</h2><form onSubmit={handleAddQuestion} className="space-y-8"><div className="grid grid-cols-6 gap-3">{['R', 'I', 'A', 'S', 'E', 'C'].map(t => (<button key={t} type="button" onClick={() => setNewQuestion({...newQuestion, riasec_type: t})} className={`p-4 rounded-2xl font-black transition-all ${newQuestion.riasec_type === t ? 'bg-indigo-900 text-white shadow-lg scale-110' : 'bg-gray-50 dark:bg-slate-900 text-gray-400 hover:bg-gray-100'}`}>{t}</button>))}</div><textarea required value={newQuestion.text} onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})} className="w-full p-8 bg-gray-50 dark:bg-slate-900 rounded-[2rem] border-2 border-transparent focus:border-indigo-500 outline-none dark:text-white font-bold text-lg shadow-inner resize-none" rows={4} placeholder="e.g. I prefer solving complex puzzles..."/><div className="flex gap-4"><button type="submit" className="flex-1 py-6 bg-[#10B981] text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-200">Push Live</button><button type="button" onClick={() => setIsAddingQuestion(false)} className="px-10 py-6 text-gray-400 font-bold hover:text-gray-600 transition-colors">Discard</button></div></form></motion.div></div>
        )}

        {isAddingPath && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsAddingPath(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" /><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-white dark:bg-[#1E293B] w-full max-w-2xl p-12 rounded-[4rem] border border-gray-100 dark:border-slate-800 shadow-2xl"><h2 className="text-4xl font-black mb-8 dark:text-white tracking-tight">New Roadmap</h2><form onSubmit={handleAddPath} className="space-y-6"><div><label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Specialization Title</label><input required value={newPath.title} onChange={(e) => setNewPath({...newPath, title: e.target.value})} className="w-full p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-indigo-500 shadow-inner" placeholder="e.g. Data Scientist"/></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">RIASEC Code</label><input required value={newPath.trait_type} onChange={(e) => setNewPath({...newPath, trait_type: e.target.value})} className="w-full p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-indigo-500 shadow-inner" placeholder="e.g. AI"/></div><div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Target Duration</label><input required value={newPath.duration} onChange={(e) => setNewPath({...newPath, duration: e.target.value})} className="w-full p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-indigo-500 shadow-inner" placeholder="e.g. 12 Weeks"/></div></div><div className="flex gap-4 pt-4"><button type="submit" className="flex-1 py-6 bg-indigo-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:scale-[1.02] transition-all">Initialize Roadmap</button><button type="button" onClick={() => setIsAddingPath(false)} className="px-10 py-6 text-gray-400 font-bold hover:text-gray-600 transition-colors">Cancel</button></div></form></motion.div></div>
        )}

        {selectedPath && (
          <div className="fixed inset-0 z-[120] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPath(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 30 }} className="relative w-full max-w-4xl h-full bg-white dark:bg-[#0F172A] p-12 lg:p-16 flex flex-col shadow-2xl rounded-l-[4rem]">
              <div className="flex justify-between items-center mb-10">
                <div><span className="text-indigo-500 font-black text-sm uppercase tracking-widest">{selectedPath.trait_type} Specialist</span><h2 className="text-4xl font-black dark:text-white">{selectedPath.title} Editor</h2></div>
                <button onClick={() => setSelectedPath(null)} className="p-4 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-2xl transition-all"><X size={36} /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-12">
                <div className="p-8 bg-[#F8FAFC] dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-800">
                  <h3 className="text-xl font-black mb-6 dark:text-white flex items-center gap-2"><Plus size={20}/> New Milestone</h3>
                  <form onSubmit={handleAddMilestone} className="flex gap-4">
                    <input required value={newMilestone.title} onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})} className="flex-1 p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-indigo-500 shadow-sm" placeholder="Title (e.g. Basics of Python)"/>
                    <input required type="number" value={newMilestone.order} onChange={(e) => setNewMilestone({...newMilestone, order: parseInt(e.target.value)})} className="w-24 p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none" />
                    <button type="submit" className="bg-indigo-900 text-white px-8 rounded-2xl font-black hover:bg-indigo-700">Add</button>
                  </form>
                </div>

                <div className="space-y-6">
                  {selectedPath.milestones?.sort((a:any, b:any) => a.order - b.order).map((m: any) => (
                    <div key={m.id} className="bg-white dark:bg-slate-800/50 p-8 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4"><div className="w-10 h-10 bg-indigo-900 text-white rounded-xl flex items-center justify-center font-black">{m.order}</div><h4 className="text-2xl font-black dark:text-white">{m.title}</h4></div>
                        <button onClick={() => api.delete(`assessments/admin/milestones/${m.id}/`).then(() => fetchAdminData(page))} className="p-2 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                        {m.resources?.map((res: any) => (
                          <div key={res.id} className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              {res.resource_type === 'VIDEO' ? <Video size={18} className="text-blue-500"/> : res.resource_type === 'DOC' ? <FileText size={18} className="text-emerald-500"/> : <BookOpen size={18} className="text-amber-500"/>}
                              <span className="font-bold text-sm dark:text-white">{res.title}</span>
                            </div>
                            <X size={14} className="text-gray-300 hover:text-red-500 cursor-pointer" onClick={() => api.delete(`assessments/admin/resources/${res.id}/`).then(() => fetchAdminData(page))}/>
                          </div>
                        ))}
                      </div>

                      {/* INDIVIDUALIZED FORM LOGIC TO PREVENT DUPLICATION */}
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-indigo-50 dark:border-slate-700">
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Attach Link</h5>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <input 
                            className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none dark:text-white" 
                            placeholder="Title" 
                            value={resourceForms[m.id]?.title || ""} 
                            onChange={(e) => setResourceForms({ ...resourceForms, [m.id]: { ...(resourceForms[m.id] || {}), title: e.target.value } })}
                          />
                          <input 
                            className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none dark:text-white" 
                            placeholder="URL" 
                            value={resourceForms[m.id]?.url || ""} 
                            onChange={(e) => setResourceForms({ ...resourceForms, [m.id]: { ...(resourceForms[m.id] || {}), url: e.target.value } })}
                          />
                        </div>
                        <div className="flex gap-3">
                          <select 
                            className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-black text-xs uppercase dark:text-white outline-none" 
                            value={resourceForms[m.id]?.resource_type || "VIDEO"} 
                            onChange={(e) => setResourceForms({ ...resourceForms, [m.id]: { ...(resourceForms[m.id] || {}), resource_type: e.target.value } })}
                          >
                            <option value="VIDEO">Video</option><option value="DOC">Docs</option><option value="COURSE">Course</option>
                          </select>
                          <button 
                            onClick={() => handleAddResource(m.id)} 
                            className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 flex items-center justify-center gap-2"
                          >
                            Attach Resource <LinkIcon size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}