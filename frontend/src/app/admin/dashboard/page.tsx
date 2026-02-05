"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserCheck, ShieldAlert, Download, Search, 
  ShieldCheck, LogOut, Sun, Moon, Database, Server, 
  ChevronLeft, ChevronRight, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  const { logout, user, isDarkMode, toggleTheme } = useAuth();
  const router = useRouter();
  
  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // UI States
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Ref for Heartbeat cleanup to stop 401 errors
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAdminData = async (pageNum = 1) => {
    const token = typeof window !== "undefined" ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const [userRes, healthRes] = await Promise.all([
        api.get(`users/admin/users/?page=${pageNum}`),
        api.get("users/admin/health/")
      ]);
      
      setUsers(userRes.data.results);
      setTotalCount(userRes.data.count);
      setTotalPages(Math.ceil(userRes.data.count / 10)); 
      setHealth(healthRes.data);
    } catch (err: any) {
      if (err.response?.status !== 401 && localStorage.getItem('access_token')) {
        console.error("Administrative load failed", err);
        toast.error("Failed to load administrative data.");
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

const handleExportCSV = async () => {
  const token = localStorage.getItem('access_token');
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/';
  
  try {
    toast.loading("Preparing audit log...");
    
    const response = await fetch(`${baseUrl}users/admin/export-audit/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Network response was not ok');

    // Get the data as a blob
    const blob = await response.blob();
    
    // Create a physical link in the DOM and click it
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `techpath_audit_${new Date().toISOString().split('T')[0]}.csv`);
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.dismiss();
    toast.success("Download started!");
  } catch (err) {
    toast.dismiss();
    toast.error("Export failed. Please check server connection.");
    console.error(err);
  }
};

  if (loading) return (
    <div className="min-h-screen bg-[#3730A3] flex items-center justify-center">
       <motion.div 
         animate={{ rotate: 360 }} 
         transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
         className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" 
       />
    </div>
  );

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans transition-colors duration-500 bg-[#F8FAFC] dark:bg-[#0F172A]">
      
      {/* Admin Sidebar - Cleaned of redundant links */}
      <aside className="w-80 bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-slate-800 p-8 hidden xl:flex flex-col shadow-sm h-screen sticky top-0 z-10 transition-colors duration-500">
        <div className="mb-12 flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-900 rounded-2xl flex items-center justify-center text-white shadow-lg transform rotate-3">
            <ShieldCheck size={26} />
          </div>
          <span className="text-2xl font-black text-[#1F2937] dark:text-white tracking-tight">Admin <span className="text-indigo-900 dark:text-indigo-400">CMD</span></span>
        </div>
        
        <nav className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-400 rounded-2xl font-black shadow-sm cursor-default">
            <Users size={22} /> User Registry
          </div>
          <div 
            onClick={handleExportCSV} 
            className="flex items-center gap-4 p-4 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-[#10B981] hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-2xl font-bold transition-all cursor-pointer"
          >
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
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                  className="absolute right-0 mt-4 w-72 bg-white dark:bg-[#1E293B] rounded-[2.5rem] shadow-2xl p-4 z-[100] border border-gray-50 dark:border-slate-800"
                >
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
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-[1.5rem] font-bold transition-all"
                    >
                      <LogOut size={20} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Real-Time System Health Pulse */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-[#111827] p-8 rounded-[3rem] shadow-2xl border border-gray-800 flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-900/30 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                <Database size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Database Health</p>
                <p className="text-white font-bold text-lg">{health?.database.status || 'Syncing...'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-[10px] font-black uppercase">Latency</p>
              <p className="text-[#10B981] font-mono font-bold text-xl">{health?.database.latency}</p>
            </div>
          </div>

          <div className="bg-[#111827] p-8 rounded-[3rem] shadow-2xl border border-gray-800 flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-900/30 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                <Server size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest">API Engine</p>
                <p className="text-white font-bold text-lg">{health?.api_server.status || 'Checking...'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-[10px] font-black uppercase">Uptime</p>
              <p className="text-blue-400 font-mono font-bold text-xl">{health?.api_server.uptime}</p>
            </div>
          </div>
        </div>

        {/* User Pulse Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-gray-50 dark:border-slate-800 transition-colors duration-500">
              <Users className="text-indigo-600 mb-4" size={32} />
              <h4 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Platform Users</h4>
              <p className="text-5xl font-black text-[#1F2937] dark:text-white">{totalCount}</p>
           </div>
           <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-gray-50 dark:border-slate-800 transition-colors duration-500">
              <UserCheck className="text-emerald-500 mb-4" size={32} />
              <h4 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Verified Mentors</h4>
              <p className="text-5xl font-black text-[#1F2937] dark:text-white">{users.filter(u => u.role === 'MENTOR').length}</p>
           </div>
           <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] shadow-xl border border-gray-50 dark:border-slate-800 transition-colors duration-500">
              <ShieldAlert className="text-red-400 mb-4" size={32} />
              <h4 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Restricted</h4>
              <p className="text-5xl font-black text-[#1F2937] dark:text-white">{users.filter(u => !u.is_active).length}</p>
           </div>
        </div>

        {/* User Registry Table with Pagination */}
        <div className="bg-white dark:bg-[#1E293B] rounded-[4rem] shadow-2xl border border-gray-50 dark:border-slate-800 overflow-hidden mb-20 transition-colors duration-500">
          <div className="p-10 border-b border-gray-50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center bg-gray-50/20 dark:bg-slate-900/20 gap-6">
            <h3 className="text-3xl font-black text-[#1F2937] dark:text-white">User Registry</h3>
            <div className="relative w-full md:w-96">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
               <input 
                 type="text" 
                 placeholder="Search registry..." 
                 className="w-full pl-14 pr-8 py-4 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-[1.5rem] outline-none focus:border-indigo-500 dark:text-white font-bold transition-all shadow-inner"
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 font-black text-xs uppercase tracking-[0.2em] border-b border-gray-50 dark:border-slate-800">
                  <th className="p-12">Identify</th>
                  <th className="p-12">Role Assignment</th>
                  <th className="p-12">Account Status</th>
                  <th className="p-12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                    <td className="p-12">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 text-indigo-900 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-[#1F2937] dark:text-white text-lg">{u.username}</p>
                          <p className="text-sm text-gray-400 font-bold">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-12">
                      <select 
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                        className="bg-gray-50 dark:bg-slate-900 dark:text-white border-2 border-gray-100 dark:border-slate-800 rounded-2xl px-6 py-3 font-black text-sm outline-none cursor-pointer hover:border-indigo-200 transition-colors appearance-none text-[#3730A3] dark:text-indigo-400"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="MENTOR">Mentor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="p-12">
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-12 text-right">
                      <button 
                        onClick={() => handleUpdateUser(u.id, { is_active: !u.is_active })}
                        className={`p-4 rounded-2xl transition-all shadow-md ${
                          u.is_active 
                            ? 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white' 
                            : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {u.is_active ? <ShieldAlert size={24} /> : <UserPlus size={24} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-10 bg-gray-50/50 dark:bg-slate-900/30 flex justify-between items-center transition-colors duration-500">
             <button 
               disabled={page === 1} 
               onClick={() => setPage(page - 1)} 
               className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm disabled:opacity-30 font-bold dark:text-white transition-all hover:bg-indigo-50 dark:hover:bg-slate-700"
             >
                <ChevronLeft size={20} /> Previous
             </button>
             <span className="font-black dark:text-white uppercase tracking-widest text-sm text-gray-400">Page {page} of {totalPages}</span>
             <button 
               disabled={page === totalPages} 
               onClick={() => setPage(page + 1)} 
               className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm disabled:opacity-30 font-bold dark:text-white transition-all hover:bg-indigo-50 dark:hover:bg-slate-700"
             >
                Next <ChevronRight size={20} />
             </button>
          </div>
        </div>
      </main>
    </div>
  );
}