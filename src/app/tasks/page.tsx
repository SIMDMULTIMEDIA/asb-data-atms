"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, where, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Clock, CheckCircle, AlertCircle, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function StaffTasksBoard() {
  const { userData } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  useEffect(() => {
    if (!userData) return;

    // Staff can see tasks assigned to them individually OR to their department
    const q = query(
      collection(getFirebaseDb() as any, "tasks"),
      where("assignedTo.assignees", "array-contains-any", [userData.uid, userData.department]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading tasks...</div>;

  const filteredTasks = tasks.filter(t => {
    if (filter === "pending") return t.status !== "completed" && t.status !== "approved" && t.status !== "cancelled";
    if (filter === "completed") return t.status === "completed" || t.status === "approved";
    return true;
  });

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A3D91]">My Tasks</h1>
          <p className="text-slate-600">Track and update your assigned tasks.</p>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6">
          {(["pending", "completed", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === f ? "bg-[#0A3D91] text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task Grid */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">You're all caught up!</h3>
            <p className="text-slate-500 mt-1">No {filter !== "all" ? filter : ""} tasks found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

const TaskCard = ({ task }: { task: Task }) => {
  const isOverdue = task.dueDate && task.dueDate.toDate() < new Date() && task.status !== "completed" && task.status !== "approved";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{task.title}</h3>
        <p className="text-xs text-slate-500 mb-4">{task.taskNumber}</p>
        
        {task.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">{task.description}</p>
        )}

        <div className="space-y-3 mt-auto">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
              <span>Progress</span>
              <span>{task.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${task.progress === 100 ? 'bg-green-500' : 'bg-[#0A3D91]'}`} 
                style={{ width: `${task.progress || 0}%` }}
              ></div>
            </div>
          </div>

          <div className={`flex items-center text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {isOverdue ? 'Overdue: ' : 'Due: '}
            {task.dueDate ? new Date(task.dueDate.toDate()).toLocaleDateString() : 'No date'}
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-end">
        <Link 
          href={`/tasks/${task.id}`} 
          className="flex items-center text-sm font-medium text-[#0A3D91] hover:text-[#082a63]"
        >
          <PlayCircle className="w-4 h-4 mr-1.5" />
          Update Progress
        </Link>
      </div>
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const getStyles = () => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium": return "bg-blue-100 text-blue-700 border-blue-200";
      case "low": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStyles()}`}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStyles = () => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700";
      case "completed": return "bg-emerald-100 text-emerald-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "assigned": return "bg-indigo-100 text-indigo-700";
      case "under_review": return "bg-yellow-100 text-yellow-700";
      case "revision_requested": return "bg-orange-100 text-orange-700";
      case "cancelled": return "bg-slate-200 text-slate-700";
      case "draft": return "bg-slate-200 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStyles()}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
