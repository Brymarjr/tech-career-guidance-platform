"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, ArrowLeft, Loader2, CheckCheck, ChevronLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function InboxPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async () => {
    try {
      const res = await api.get(`users/threads/?v=${Date.now()}`);
      setThreads(res.data);
      setRefreshKey(prev => prev + 1); 

      if (activeThread) {
        const refreshed = res.data.find((t: any) => t.id === activeThread.id);
        if (refreshed) {
            setActiveThread({...refreshed}); 
        }
      }
    } catch (err) {
      console.error("Sync failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: number) => {
    try {
      const res = await api.get(`users/threads/${threadId}/messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error("Message sync error");
    }
  };

  useEffect(() => {
    fetchThreads();
    const threadInterval = setInterval(fetchThreads, 10000);
    return () => clearInterval(threadInterval);
  }, [activeThread?.id]);

  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread.id);
      const interval = setInterval(() => fetchMessages(activeThread.id), 5000);
      return () => clearInterval(interval);
    }
  }, [activeThread?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;

    setSending(true);
    try {
      const res = await api.post(`users/threads/${activeThread.id}/messages/`, {
        content: newMessage,
      });
      setMessages([...messages, res.data]);
      setNewMessage("");
      fetchThreads(); 
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Mentorship has ended. This thread is now read-only.");
      } else {
        toast.error("Message failed to send.");
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#0F172A]">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0F172A] overflow-hidden transition-colors duration-500">
      
      <aside className={`w-full md:w-96 bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-slate-800 flex flex-col ${activeThread ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-gray-50 dark:border-slate-800 space-y-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-[#3730A3] dark:hover:text-white transition-colors font-bold text-sm"
          >
            <ChevronLeft size={18} /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-[#1F2937] dark:text-white tracking-tight">Messages</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {threads.length === 0 ? (
            <div className="text-center p-10 text-gray-400 font-medium">No active conversations.</div>
          ) : (
            threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveThread(t)}
                className={`p-5 rounded-3xl cursor-pointer transition-all border-2 ${
                  activeThread?.id === t.id 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-500' 
                    : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black dark:text-white">{t.other_user.full_name || t.other_user.username}</h3>
                    {t.other_user.is_online && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-1 bg-gray-100 dark:bg-slate-700 dark:text-gray-300 rounded-full">
                    {t.other_user.role}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500 truncate flex-1">{t.last_message?.content || "Start a conversation..."}</p>
                  {t.unread_count > 0 && (
                    <span className="w-5 h-5 bg-[#3730A3] text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg">
                      {t.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col relative ${!activeThread ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeThread ? (
          <>
            <header 
              key={`header-${activeThread.other_user.last_seen}`} 
              className="p-6 bg-white dark:bg-[#1E293B] border-b border-gray-100 dark:border-slate-800 flex items-center gap-4"
            >
              <button onClick={() => setActiveThread(null)} className="md:hidden p-2 text-gray-500"><ArrowLeft /></button>
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                {activeThread.other_user.username[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-black text-lg dark:text-white">{activeThread.other_user.full_name || activeThread.other_user.username}</h2>
                {activeThread.other_user.is_online ? (
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online Now
                    </span>
                ) : (
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Last seen {activeThread.other_user.last_seen ? new Date(activeThread.other_user.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                    </span>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((m) => {
                const isMe = m.sender_username === user?.username;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={m.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-5 rounded-[2rem] shadow-sm ${
                      isMe 
                        ? 'bg-[#3730A3] text-white rounded-br-none' 
                        : 'bg-white dark:bg-[#1E293B] dark:text-gray-200 border border-gray-100 dark:border-slate-800 rounded-bl-none'
                    }`}>
                      <p className="font-medium leading-relaxed">{m.content}</p>
                      <div className={`flex items-center gap-2 mt-2 text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          <CheckCheck 
                            size={14} 
                            className={m.is_read ? "text-emerald-400" : "opacity-40"} 
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* UPDATED: Read-Only Check logic */}
            {activeThread.is_active === false ? (
              <div className="p-8 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-black uppercase text-[10px] tracking-widest">
                  <ShieldAlert size={16} /> Read-Only Archive
                </div>
                <p className="text-gray-400 text-sm font-medium italic text-center">
                  Mentorship between {activeThread.student_name} and {activeThread.mentor_name} has ended.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-8 bg-white dark:bg-[#1E293B] border-t border-gray-100 dark:border-slate-800">
                <div className="flex gap-4 items-center bg-gray-50 dark:bg-slate-900 p-2 rounded-[2.5rem] border-2 border-transparent focus-within:border-indigo-500 transition-all">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent p-4 outline-none dark:text-white font-medium"
                  />
                  <button
                    disabled={sending}
                    className="bg-[#3730A3] text-white p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-indigo-500 mx-auto mb-6 shadow-inner">
              <MessageSquare size={48} />
            </div>
            <h2 className="text-2xl font-black dark:text-white">Select a contact</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Pick a thread to continue your career growth.</p>
          </div>
        )}
      </main>
    </div>
  );
}