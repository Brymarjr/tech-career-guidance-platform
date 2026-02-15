"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Bell, CheckCheck, X, Target, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePresence } from "@/context/PresenceContext";

export default function NotificationBell() {
  const [notes, setNotes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { unreadNotifications } = usePresence();

  const fetchNotes = async () => {
    try {
      const res = await api.get("users/notifications/");
      setNotes(res.data);
    } catch (err) { 
      console.error("Failed to fetch notifications:", err); 
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (unreadNotifications > 0) {
      fetchNotes();
    }
  }, [unreadNotifications]);

  const markAllRead = async () => {
    try {
      await api.patch("users/notifications/");
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id: number) => {
    try {
      await api.patch(`users/notifications/${id}/`);
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notes.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-4 bg-white dark:bg-[#1E293B] rounded-2xl shadow-lg relative transition-all hover:scale-110 group"
      >
        <Bell className={unreadCount > 0 ? "text-indigo-600 animate-swing" : "text-gray-400 group-hover:text-indigo-500"} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-[#1E293B] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
            className="absolute right-0 mt-4 w-80 bg-white dark:bg-[#1E293B] rounded-[2rem] shadow-2xl border dark:border-slate-800 p-6 z-[100]"
          >
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black dark:text-white">Alerts</h4>
              <button 
                onClick={markAllRead} 
                className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto text-gray-200 mb-2" size={32} />
                  <p className="text-gray-400 text-xs italic">No new alerts.</p>
                </div>
              ) : (
                notes.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markSingleRead(n.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                      n.is_read 
                        ? 'bg-transparent border-transparent opacity-40' 
                        : 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-500/20'
                    }`}
                  >
                    <div className="flex gap-3">
                        {!n.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />}
                        <div className="flex-1">
                            <p className="text-sm dark:text-gray-200 font-bold leading-tight mb-1">{n.message}</p>
                            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400">
                                {(() => {
                                    if (!n.created_at) return "Just now";
                                    const d = new Date(n.created_at);
                                    return isNaN(d.getTime()) 
                                      ? n.created_at 
                                      : `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                })()}
                            </span>
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}