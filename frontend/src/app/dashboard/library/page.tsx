"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { 
  BookOpen, Video, FileText, ExternalLink, Search, 
  Filter, ArrowLeft, PlayCircle, Book
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LearningLibrary() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await api.get("assessments/library/");
        setData(res.data);
      } catch (err) {
        toast.error("Failed to load library resources");
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  const filteredResources = (data?.resources || []).filter((r: any) => 
    (r.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-12 font-sans transition-colors duration-500">
      <header className="mb-12">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#3730A3] dark:hover:text-white transition-colors font-bold mb-8"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-black text-[#1F2937] dark:text-white tracking-tight mb-2">Learning Library</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">
              Access all materials for <span className="text-indigo-600 dark:text-indigo-400 font-bold">{data?.path_title}</span>
            </p>
          </motion.div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-4 ring-indigo-50 dark:ring-indigo-900/20 font-bold dark:text-white transition-all shadow-sm"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredResources?.length > 0 ? (
          filteredResources.map((res: any) => (
            <motion.a
              key={res.id}
              href={res.url}
              target="_blank"
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${
                  res.resource_type === 'VIDEO' ? 'bg-blue-50 text-blue-600' : 
                  res.resource_type === 'DOC' ? 'bg-emerald-50 text-emerald-600' : 
                  'bg-amber-50 text-amber-600'
                }`}>
                  {res.resource_type === 'VIDEO' ? <Video size={24} /> : res.resource_type === 'DOC' ? <FileText size={24} /> : <Book size={24} />}
                </div>
                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-gray-400 group-hover:text-indigo-600 transition-colors">
                  <ExternalLink size={18} />
                </div>
              </div>

              <h3 className="text-xl font-black text-[#1F2937] dark:text-white mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                {res.title || res.name}
              </h3>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                {res.resource_type}
              </span>
            </motion.a>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-[#1E293B] rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-800">
            <BookOpen className="mx-auto text-gray-200 mb-4" size={64} />
            <p className="text-gray-400 font-bold text-xl">No resources found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}