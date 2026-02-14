"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { CheckCircle, Clock, Plus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TaskSidebar({ activeUser, currentUserRole }: { activeUser: any, currentUserRole: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", xp_reward: 100 });

  const fetchTasks = async () => {
    try {
      const res = await api.get('users/tasks/');
      // Filter tasks to only show those between the current user and the active chat partner
      const filtered = res.data.filter((t: any) => 
        t.student_username === activeUser.username || t.mentor_username === activeUser.username
      );
      setTasks(filtered);
    } catch (err) {
      console.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [activeUser.id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('users/tasks/', { ...newTask, student: activeUser.id });
      toast.success("Task assigned!");
      setShowAddForm(false);
      fetchTasks();
    } catch (err) {
      toast.error("Failed to assign task");
    }
  };

  const handleStatusUpdate = async (taskId: number, status: string) => {
    try {
      await api.patch(`users/tasks/${taskId}/update/`, { status });
      toast.success(`Task marked as ${status.toLowerCase()}`);
      fetchTasks();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-[#1E293B] border-l border-gray-100 dark:border-slate-800 flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
        <h2 className="font-black text-xl dark:text-white">Path Tasks</h2>
        {currentUserRole === 'MENTOR' && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 bg-indigo-500 text-white rounded-xl hover:scale-105 transition-all"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showAddForm && (
          <form onSubmit={handleCreateTask} className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl space-y-3 border-2 border-indigo-500/30">
            <input 
              className="w-full bg-white dark:bg-slate-800 p-2 rounded-lg text-sm outline-none border dark:border-slate-700" 
              placeholder="Task Title"
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              required 
            />
            <textarea 
              className="w-full bg-white dark:bg-slate-800 p-2 rounded-lg text-sm outline-none border dark:border-slate-700 h-20" 
              placeholder="Description"
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              required
            />
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm">Assign Task</button>
          </form>
        )}

        {tasks.map(task => (
          <div key={task.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                task.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {task.status}
              </span>
              <span className="text-[10px] font-bold text-indigo-500">+{task.xp_reward} XP</span>
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white text-sm">{task.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{task.description}</p>
            
            <div className="mt-4 flex gap-2">
              {currentUserRole === 'STUDENT' && task.status === 'PENDING' && (
                <button 
                  onClick={() => handleStatusUpdate(task.id, 'COMPLETED')}
                  className="flex-1 bg-gray-900 dark:bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold"
                >
                  Mark Done
                </button>
              )}
              {currentUserRole === 'MENTOR' && task.status === 'COMPLETED' && (
                <button 
                  onClick={() => handleStatusUpdate(task.id, 'APPROVED')}
                  className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold"
                >
                  Approve & Award XP
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}