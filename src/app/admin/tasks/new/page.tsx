"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { createTask } from "@/services/task";
import { logActivity } from "@/services/logger";
import { sendNotification } from "@/services/notifications";
import { TaskStatus, TaskPriority, TaskVisibility, UserProfile } from "@/types";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";

export default function CreateTaskPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [visibility, setVisibility] = useState<TaskVisibility>("private");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  
  const [assigneeType, setAssigneeType] = useState<"individual" | "department" | "multiple">("individual");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  
  const DEPARTMENTS = [
    "developer",
    "marketing_adhoc",
    "marketing_contract",
    "customer_care",
    "automation",
    "administration"
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(getFirebaseDb() as any, "users"));
      const snapshot = await getDocs(q);
      const fetchedUsers = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, []);

  const handleAssigneeChange = (val: string) => {
    if (assigneeType === "multiple") {
      if (selectedAssignees.includes(val)) {
        setSelectedAssignees(selectedAssignees.filter(v => v !== val));
      } else {
        setSelectedAssignees([...selectedAssignees, val]);
      }
    } else {
      setSelectedAssignees([val]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || selectedAssignees.length === 0 || !title || !dueDate) return;

    setLoading(true);
    try {
      const parsedDate = new Date(dueDate);
      
      const taskId = await createTask({
        title,
        description,
        status: "assigned",
        priority,
        visibility,
        assignedTo: {
          type: assigneeType,
          assignees: selectedAssignees
        },
        createdBy: userData.uid,
        dueDate: Timestamp.fromDate(parsedDate),
        progress: 0,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined
      });

      await logActivity(userData.uid, "task_created", "all");
      
      // Notify assignees
      if (assigneeType === "individual" || assigneeType === "multiple") {
        for (const uid of selectedAssignees) {
          await sendNotification(
            uid,
            "New Task Assigned",
            `You have been assigned a new task: ${title}`,
            "task",
            priority === "critical" ? "high" : "medium"
          );
        }
      } else if (assigneeType === "department") {
        const deptId = selectedAssignees[0];
        const deptUsers = users.filter(u => u.department === deptId);
        for (const u of deptUsers) {
          await sendNotification(
            u.uid,
            "New Department Task",
            `A new task has been assigned to your department: ${title}`,
            "task",
            priority === "critical" ? "high" : "medium"
          );
        }
      }

      router.push("/admin/tasks");
    } catch (err) {
      console.error("Failed to create task", err);
      alert("Failed to create task");
      setLoading(false);
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="p-8 max-w-3xl mx-auto">
        <Link href="/admin/tasks" className="inline-flex items-center text-slate-500 hover:text-[#0A3D91] mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Create New Task</h1>
            <p className="text-sm text-slate-500">Assign work to individuals or departments.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                  placeholder="e.g., Update Q3 Marketing Materials"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                  placeholder="Provide detailed instructions..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority *</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Visibility *</label>
                  <select 
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as TaskVisibility)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                  >
                    <option value="private">Private (Assignees Only)</option>
                    <option value="department">Department (All in Dept)</option>
                    <option value="public_department">Public Department (Visible cross-dept)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Hours</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                    placeholder="e.g., 4"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-3">Assignment</label>
                
                <div className="flex space-x-4 mb-4">
                  {(["individual", "department", "multiple"] as const).map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="assigneeType" 
                        checked={assigneeType === type}
                        onChange={() => { setAssigneeType(type); setSelectedAssignees([]); }}
                        className="text-[#0A3D91] focus:ring-[#0A3D91]"
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>

                {assigneeType === "department" ? (
                  <select 
                    value={selectedAssignees[0] || ""}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                    required
                  >
                    <option value="" disabled>Select Department...</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d} className="capitalize">{d.replace('_', ' ')}</option>
                    ))}
                  </select>
                ) : (
                  <div className={`border border-slate-300 rounded-md p-2 max-h-48 overflow-y-auto ${assigneeType === "multiple" ? "space-y-1" : ""}`}>
                    {users.map(u => (
                      <label key={u.uid} className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input 
                          type={assigneeType === "multiple" ? "checkbox" : "radio"}
                          name="assignee"
                          checked={selectedAssignees.includes(u.uid)}
                          onChange={() => handleAssigneeChange(u.uid)}
                          className={`text-[#0A3D91] focus:ring-[#0A3D91] ${assigneeType === "multiple" ? "rounded" : "rounded-full"}`}
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-900">{u.fullName}</p>
                          <p className="text-xs text-slate-500 capitalize">{u.department.replace('_', ' ')} • {u.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {selectedAssignees.length} selected
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={loading || selectedAssignees.length === 0}
                className="flex items-center px-6 py-2 bg-[#0A3D91] text-white rounded-md font-medium hover:bg-[#082a63] transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
