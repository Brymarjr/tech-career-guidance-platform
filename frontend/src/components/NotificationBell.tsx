"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Bell, CheckCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const [notes, setNotes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await api.get("users/notifications/");
      setNotes(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    await api.patch("users/notifications/");
    fetchNotes();
  };

  const unreadCount = notes.filter(n => !n.is_read).length;

  const markSingleRead = async (id: number) => {
  await api.patch(`users/notifications/${id}/`); // Hits the <int:pk> URL
  fetchNotes();
};

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-4 bg-white dark:bg-[#1E293B] rounded-2xl shadow-lg relative transition-all hover:scale-110">
        <Bell className={unreadCount > 0 ? "text-indigo-600 animate-swing" : "text-gray-400"} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-[#1E293B]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-80 bg-white dark:bg-[#1E293B] rounded-[2rem] shadow-2xl border dark:border-slate-800 p-6 z-[100]">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black dark:text-white">Notifications</h4>
              <button onClick={markAllRead} className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
                <CheckCheck size={14} /> Mark all read
              </button>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
              {notes.length === 0 && <p className="text-gray-400 text-sm text-center py-4 italic">No new alerts.</p>}
              {notes.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markSingleRead(n.id)} // NEW: Click to read
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    n.is_read ? 'opacity-50' : 'bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-indigo-500'
                  }`}
                >
                  <p className="dark:text-white font-medium">{n.message}</p>
                  <span className="text-[10px] text-gray-400">{n.created_at}</span>
                 </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}