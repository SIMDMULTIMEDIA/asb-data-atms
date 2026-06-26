"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CheckCircle, Clock, AlertCircle, FileText, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminTasksDashboard() {
  const { userData } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return;
    }

    const q = query(
      collection(getFirebaseDb() as any, "tasks"),
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

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status !== "completed" && t.status !== "approved" && t.status !== "cancelled").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate.toDate() < new Date() && t.status !== "completed" && t.status !== "approved").length;

  return (
    <AuthGuard requiredRole="admin">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D91]">Task Management Panel</h1>
            <p className="text-slate-600">Assign, track, and manage all enterprise tasks.</p>
          </div>
          <Link href="/admin/tasks/new" className="flex items-center px-4 py-2 bg-[#0A3D91] text-white rounded-md font-medium hover:bg-[#082a63] transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            Create Task
          </Link>
        </div>

        {/* Analytics Widget */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Total Tasks" value={totalTasks} icon={<FileText className="w-5 h-5 text-blue-500" />} />
          <MetricCard title="In Progress" value={pendingTasks} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
          <MetricCard title="Completed" value={completedTasks} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
          <MetricCard title="Overdue" value={overdueTasks} icon={<AlertCircle className="w-5 h-5 text-red-500" />} />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Number</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-900">{task.taskNumber || "N/A"}</td>
                    <td className="p-4 text-sm text-slate-900 font-medium truncate max-w-xs">{task.title}</td>
                    <td className="p-4 text-sm">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="p-4 text-sm">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-[#0A3D91] h-2.5 rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                      </div>
                      <span className="text-[10px] mt-1 block">{task.progress || 0}%</span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {task.dueDate ? new Date(task.dueDate.toDate()).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4 text-sm text-right">
                      <Link href={`/admin/tasks/${task.id}`} className="text-[#0A3D91] hover:underline font-medium">Manage</Link>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">No tasks found. Create one to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

const MetricCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3">
    <div className="p-2 bg-slate-50 rounded-lg">
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase">{title}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

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
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStyles()}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
