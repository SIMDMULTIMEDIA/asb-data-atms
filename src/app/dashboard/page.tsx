"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { ActivityFeed, Task } from "@/types";
import { Clock, CheckCircle, AlertCircle, FileText, LayoutDashboard, Briefcase, CheckSquare } from "lucide-react";

export default function StaffDashboardPage() {
  const { userData } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myOpenTasks: 0,
    myPendingReports: 0,
    attendanceToday: "Not Checked In"
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityFeed[]>([]);

  // Redirect admins to the full admin dashboard layout
  useEffect(() => {
    if (userData?.role === 'admin' || userData?.role === 'super_admin') {
      router.push('/admin/dashboard');
    }
  }, [userData, router]);

  // Fetch staff stats
  useEffect(() => {
    if (!userData || userData.role === 'admin' || userData.role === 'super_admin') return;

    const db = getFirebaseDb() as any;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. My Attendance Today
    const unsubAttendance = onSnapshot(
      query(
        collection(db, "attendance"), 
        where("userId", "==", userData.uid),
        where("createdAt", ">=", today)
      ),
      (snap) => {
        if (!snap.empty) {
          const doc = snap.docs[0].data();
          setStats(prev => ({ ...prev, attendanceToday: doc.status === "present" ? "Present" : doc.status === "late" ? "Late" : "Checked In" }));
        }
      }
    );

    // 2. My Open Tasks
    const unsubTasks = onSnapshot(
      query(
        collection(db, "tasks"),
        where("assignedTo.assignees", "array-contains", userData.uid)
      ),
      (snap) => {
        let open = 0;
        const tasks: Task[] = [];
        snap.forEach(doc => {
          const t = doc.data() as Task;
          if (t.status !== "completed" && t.status !== "approved" && t.status !== "cancelled") {
            open++;
            tasks.push({ ...t, id: doc.id });
          }
        });
        setStats(prev => ({ ...prev, myOpenTasks: open }));
        setRecentTasks(tasks.slice(0, 5)); // Just show 5 recent
      }
    );

    // 3. My Pending Reports
    const unsubReports = onSnapshot(
      query(
        collection(db, "reports"),
        where("userId", "==", userData.uid)
      ),
      (snap) => {
        let pending = 0;
        snap.forEach(doc => {
          const r = doc.data();
          if (r.status === "submitted" || r.status === "under_review" || r.status === "correction_requested") pending++;
        });
        setStats(prev => ({ ...prev, myPendingReports: pending }));
      }
    );

    // 4. My Recent Activity
    const unsubActivity = onSnapshot(
      query(
        collection(db, "activity_feed"),
        where("userId", "==", userData.uid),
        orderBy("timestamp", "desc"),
        limit(5)
      ),
      (snap) => {
        setRecentActivity(snap.docs.map(d => ({ feedId: d.id, ...d.data() } as ActivityFeed)));
        setLoading(false);
      }
    );

    return () => {
      unsubAttendance();
      unsubTasks();
      unsubReports();
      unsubActivity();
    };
  }, [userData]);

  // Don't render staff UI for admins while redirecting
  if (userData?.role === 'admin' || userData?.role === 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 flex items-center"><Clock className="animate-spin w-5 h-5 mr-2" /> Redirecting to Enterprise Dashboard...</p>
      </div>
    );
  }

  return (
    <StaffLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-2 text-[#F5A623]" />
            My Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Welcome back, {userData?.fullName}</p>
        </div>

        {/* Staff KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Attendance Today" 
            value={stats.attendanceToday} 
            icon={stats.attendanceToday === "Not Checked In" ? <AlertCircle className="w-5 h-5 text-orange-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />} 
          />
          <MetricCard 
            title="My Open Tasks" 
            value={stats.myOpenTasks} 
            icon={<CheckSquare className="w-5 h-5 text-blue-500" />} 
          />
          <MetricCard 
            title="Pending Reports" 
            value={stats.myPendingReports} 
            icon={<FileText className="w-5 h-5 text-indigo-500" />} 
          />
        </div>

        {/* Role Specific Shortcuts */}
        {(userData?.role === 'marketer_adhoc' || userData?.role === 'marketer_contract' || userData?.role === 'customer_care') && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-orange-800 flex items-center mb-1">
                <Briefcase className="w-5 h-5 mr-2" />
                CRM & Leads
              </h3>
              <p className="text-orange-600/80 text-sm">Manage your leads and customer interactions.</p>
            </div>
            <button 
              onClick={() => router.push('/crm')}
              className="px-6 py-2 bg-white text-orange-600 font-bold rounded-lg shadow-sm border border-orange-200 hover:bg-orange-50 transition-colors"
            >
              Open CRM
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Active Tasks</h3>
              <button onClick={() => router.push('/tasks')} className="text-xs font-semibold text-[#F5A623] hover:underline">View All</button>
            </div>
            <div className="p-5">
              {recentTasks.length > 0 ? (
                <div className="space-y-4">
                  {recentTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{task.title}</p>
                        <p className="text-xs text-slate-500 mt-1">Due: {new Date(task.dueDate.toDate()).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm">You have no active tasks!</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">My Recent Activity</h3>
            </div>
            <div className="p-5">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map(act => (
                    <div key={act.feedId} className="flex space-x-3 text-sm">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-[#F5A623]"></div>
                      </div>
                      <div>
                        <p className="text-slate-800">
                          {act.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {act.timestamp ? new Date(act.timestamp.toDate()).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm">No recent activity found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </StaffLayout>
  );
}

const MetricCard = ({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      <span className="text-xl font-bold text-slate-900">{value}</span>
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
  </div>
);
