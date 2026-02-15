"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, MessageSquare, ArrowLeft, Loader2, CheckCheck, 
  ChevronLeft, ShieldAlert, ListChecks, Plus, X, Target, Award, Clock 
} from "lucide-react";
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
  const socketRef = useRef<WebSocket | null>(null);

  // --- Task System States ---
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskData, setTaskData] = useState({ title: "", description: "", xp_reward: 100 });

  // Listen for global "Open Tasks" event
  useEffect(() => {
    const handleOpenSidebar = () => setShowTasks(true);
    window.addEventListener("open-task-sidebar", handleOpenSidebar);
    return () => window.removeEventListener("open-task-sidebar", handleOpenSidebar);
  }, []);

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

  const fetchTasks = async () => {
    if (!activeThread) return;
    try {
      const res = await api.get('users/tasks/');
      const filtered = res.data.filter((t: any) => 
        t.student_username === activeThread.other_user.username || 
        t.mentor_username === activeThread.other_user.username
      );
      setTasks(filtered);
    } catch (err) {
      console.error("Task sync error");
    }
  };

  // WebSocket for Real-time Messages & Read Receipts
  useEffect(() => {
    if (activeThread && user) {
      const token = localStorage.getItem('access_token');
      const wsUrl = `ws://localhost:8000/ws/chat/${activeThread.id}/?token=${token}`;
      
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        // Signal the server to mark existing messages as read
        socketRef.current?.send(JSON.stringify({ type: 'read_messages' }));
      };

      socketRef.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        
        // Handle new incoming messages
        if (data.message) {
            setMessages((prev) => [...prev, data.message]);
            fetchThreads();
            // If the message is from someone else while we are active, mark it read
            if (data.message.sender_username !== user.username) {
                socketRef.current?.send(JSON.stringify({ type: 'read_messages' }));
            }
        }
        
        // Handle Read Receipt Signal (The Blue Ticks)
        if (data.type === 'MESSAGES_READ') {
            setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
        }
      };

      return () => socketRef.current?.close();
    }
  }, [activeThread?.id]);

  useEffect(() => {
    fetchThreads();
  }, [activeThread?.id]);

  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread.id);
      fetchTasks();
    }
  }, [activeThread?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ 'message': newMessage }));
        setNewMessage("");
    } else {
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
            toast.error("Mentorship has ended.");
          } else {
            toast.error("Message failed to send.");
          }
        } finally {
          setSending(false);
        }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('users/tasks/', { ...taskData, student: activeThread.other_user.id });
      toast.success("Task assigned successfully!");
      setShowTaskForm(false);
      setTaskData({ title: "", description: "", xp_reward: 100 });
      fetchTasks();
    } catch (err) {
      toast.error("Error assigning task.");
    }
  };

  const handleUpdateTask = async (taskId: number, status: string) => {
    try {
      await api.patch(`users/tasks/${taskId}/update/`, { status });
      toast.success(`Task ${status.toLowerCase()}!`);
      fetchTasks();
    } catch (err) {
      toast.error("Action failed.");
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
                  <p className="text-sm text-gray-500 truncate flex-1 font-medium">{t.last_message?.content || "Start a conversation..."}</p>
                  {t.unread_count > 0 && (
                    <span className="w-5 h-5 bg-[#3730A3] text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg animate-bounce">
                      {t.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 flex overflow-hidden">
        <main className={`flex-1 flex flex-col relative ${!activeThread ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
          {activeThread ? (
            <>
              <header className="p-6 bg-white dark:bg-[#1E293B] border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
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
                </div>

                <button 
                    onClick={() => setShowTasks(!showTasks)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all ${
                        showTasks ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-indigo-50 text-indigo-600 dark:bg-slate-800'
                    }`}
                >
                    <ListChecks size={18} /> {showTasks ? 'Hide Tasks' : 'View Path Tasks'}
                </button>
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
                              className={m.is_read ? "text-sky-400 drop-shadow-[0_0_2px_rgba(56,189,248,0.8)]" : "opacity-40"} 
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

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
            </>
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-indigo-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-indigo-500 mx-auto mb-6 shadow-inner">
                <MessageSquare size={48} />
              </div>
              <h2 className="text-2xl font-black dark:text-white">Select a contact</h2>
            </div>
          )}
        </main>

        <AnimatePresence>
          {showTasks && activeThread && (
            <motion.aside 
                initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
                className="w-80 bg-white dark:bg-[#1E293B] border-l border-gray-100 dark:border-slate-800 flex flex-col h-full shadow-2xl"
            >
                <div className="p-8 border-b border-gray-50 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black dark:text-white flex items-center gap-2">
                           <Target className="text-indigo-500" /> Tasks
                        </h2>
                        {user?.role === 'MENTOR' && (
                            <button 
                                onClick={() => setShowTaskForm(!showTaskForm)}
                                className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:rotate-90 transition-all duration-300"
                            >
                                {showTaskForm ? <X size={20} /> : <Plus size={20} />}
                            </button>
                        )}
                    </div>

                    {showTaskForm && (
                        <motion.form 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            onSubmit={handleCreateTask} 
                            className="space-y-3 bg-gray-50 dark:bg-slate-900 p-4 rounded-3xl border border-indigo-100 dark:border-indigo-900/50"
                        >
                            <input 
                                className="w-full bg-white dark:bg-slate-800 p-3 rounded-2xl text-xs outline-none border border-transparent focus:border-indigo-500 transition-all" 
                                placeholder="Task Title"
                                value={taskData.title}
                                onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                                required 
                            />
                            <textarea 
                                className="w-full bg-white dark:bg-slate-800 p-3 rounded-2xl text-xs outline-none border border-transparent focus:border-indigo-500 transition-all h-24" 
                                placeholder="Details..."
                                value={taskData.description}
                                onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                                required
                            />
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black text-xs uppercase shadow-lg">Assign Task</button>
                        </motion.form>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="mx-auto text-gray-200 mb-4" size={40} />
                            <p className="text-gray-400 font-bold text-sm">No tasks assigned.</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div key={task.id} className="p-5 bg-white dark:bg-[#0F172A] rounded-[2rem] border-2 border-gray-50 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-center mb-3">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${
                                        task.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {task.status}
                                    </span>
                                    <div className="flex items-center gap-1 text-indigo-500 font-black text-[10px]">
                                        <Award size={14} /> +{task.xp_reward} XP
                                    </div>
                                </div>
                                <h3 className="font-black text-gray-800 dark:text-white text-sm leading-tight">{task.title}</h3>
                                <p className="text-xs text-gray-500 mt-2">{task.description}</p>
                                
                                {user?.role === 'STUDENT' && task.status === 'PENDING' && (
                                    <button 
                                        onClick={() => handleUpdateTask(task.id, 'COMPLETED')}
                                        className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase"
                                    >
                                        Mark Done
                                    </button>
                                )}

                                {user?.role === 'MENTOR' && task.status === 'COMPLETED' && (
                                    <button 
                                        onClick={() => handleUpdateTask(task.id, 'APPROVED')}
                                        className="w-full mt-4 bg-emerald-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase"
                                    >
                                        Approve XP
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}