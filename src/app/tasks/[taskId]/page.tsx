"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, use } from "react";
import { doc, onSnapshot, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Task, TaskComment } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { updateTask, addTaskComment } from "@/services/task";
import { logActivity } from "@/services/logger";
import { ArrowLeft, Clock, Save, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const resolvedParams = use(params);
  const { taskId } = resolvedParams;
  const { userData } = useAuth();
  const router = useRouter();
  
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Update state
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [actualHours, setActualHours] = useState("");
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userData || !taskId) return;

    const unsubTask = onSnapshot(doc(getFirebaseDb() as any, "tasks", taskId), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Task;
        setTask(data);
        setProgress(data.progress || 0);
        setStatus(data.status);
        setActualHours(data.actualHours?.toString() || "");
      } else {
        router.push("/tasks");
      }
      setLoading(false);
    });

    const commentsQ = query(
      collection(getFirebaseDb() as any, "task_comments"),
      where("taskId", "==", taskId),
      orderBy("createdAt", "asc")
    );
    
    const unsubComments = onSnapshot(commentsQ, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskComment)));
    });

    return () => {
      unsubTask();
      unsubComments();
    };
  }, [taskId, userData, router]);

  const handleUpdate = async () => {
    if (!task || !userData) return;
    setSaving(true);
    try {
      await updateTask(taskId, {
        progress,
        status: status as Task["status"],
        actualHours: actualHours ? parseFloat(actualHours) : undefined
      });
      
      if (progress > task.progress) {
        await logActivity(userData.uid, "task_progress_updated", userData.department || "all");
      }
      
      if (status === "under_review" && task.status !== "under_review") {
        await logActivity(userData.uid, "task_submitted_for_review", userData.department || "all");
      }

      alert("Task updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update task.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userData) return;
    try {
      await addTaskComment(taskId, userData.uid, newComment);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading task...</div>;
  if (!task) return null;

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <Link href="/tasks" className="inline-flex items-center text-slate-500 hover:text-[#0A3D91] mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{task.taskNumber}</span>
                    <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium capitalize">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                {task.description && (
                  <div className="prose prose-sm max-w-none text-slate-600 mt-4">
                    {task.description}
                  </div>
                )}
              </div>

              {/* Progress & Update Form */}
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Update Progress</h3>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                      <label>Progress</label>
                      <span>{progress}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" step="5"
                      value={progress}
                      onChange={(e) => setProgress(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A3D91]"
                      disabled={task.status === "approved" || task.status === "completed"}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select 
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                        disabled={task.status === "approved" || task.status === "completed"}
                      >
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="under_review">Ready for Review (Submit)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Actual Hours Spent</label>
                      <input 
                        type="number" step="0.5"
                        value={actualHours}
                        onChange={(e) => setActualHours(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                        placeholder={task.estimatedHours ? `Est: ${task.estimatedHours}h` : "e.g., 2.5"}
                        disabled={task.status === "approved" || task.status === "completed"}
                      />
                    </div>
                  </div>

                  {task.status !== "approved" && task.status !== "completed" && (
                    <button
                      onClick={handleUpdate}
                      disabled={saving}
                      className="w-full flex justify-center items-center px-4 py-2 bg-[#0A3D91] text-white rounded-md font-medium hover:bg-[#082a63] transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Updates
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900">Discussion</h3>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {comments.map(c => (
                  <div key={c.id} className={`flex flex-col ${c.userId === userData?.uid ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${c.userId === userData?.uid ? 'bg-[#0A3D91] text-white' : 'bg-slate-100 text-slate-800'}`}>
                      <p className="text-sm">{c.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {c.createdAt ? new Date(c.createdAt.toDate()).toLocaleString() : "Just now"}
                    </span>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-4">No comments yet. Start the conversation!</p>
                )}
              </div>
              <div className="p-4 border-t border-slate-200">
                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type a comment..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-full text-sm focus:outline-none focus:border-[#0A3D91]"
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="p-2 bg-[#0A3D91] text-white rounded-full hover:bg-[#082a63] disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Task Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Due Date</p>
                  <p className="text-sm font-medium text-slate-900 flex items-center">
                    <Clock className="w-4 h-4 text-slate-400 mr-2" />
                    {task.dueDate ? new Date(task.dueDate.toDate()).toLocaleDateString() : "No Due Date"}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">Priority</p>
                  <p className="text-sm font-medium capitalize text-slate-900">{task.priority}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Estimated Hours</p>
                  <p className="text-sm font-medium text-slate-900">{task.estimatedHours || "-"} hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
