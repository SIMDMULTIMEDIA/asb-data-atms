"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, where, orderBy, limit } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ActivityFeed } from "@/types";
import { Users, Clock, FileText, CheckCircle, AlertCircle, LayoutDashboard, TrendingUp } from "lucide-react";

export default function ExecutiveDashboard() {
  const { userData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    lateArrivals: 0,
    openTasks: 0,
    overdueTasks: 0,
    pendingReports: 0,
    approvedReports: 0
  });
  
  const [activities, setActivities] = useState<ActivityFeed[]>([]);

  useEffect(() => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Users
    const unsubUsers = onSnapshot(collection(getFirebaseDb() as any, "users"), (snap) => {
      setStats(prev => ({ ...prev, totalStaff: snap.size }));
    });

    // 2. Attendance today
    const unsubAttendance = onSnapshot(
      query(collection(getFirebaseDb() as any, "attendance"), where("createdAt", ">=", today)),
      (snap) => {
        let present = 0;
        let late = 0;
        snap.forEach(doc => {
          const d = doc.data();
          if (d.status === "present") present++;
          if (d.status === "late") late++;
        });
        setStats(prev => ({ 
          ...prev, 
          presentToday: present + late, 
          lateArrivals: late,
          // Simplified absence calculation: total staff - present - late
          absentToday: prev.totalStaff > 0 ? Math.max(0, prev.totalStaff - (present + late)) : 0
        }));
      }
    );

    // 3. Tasks
    const unsubTasks = onSnapshot(collection(getFirebaseDb() as any, "tasks"), (snap) => {
      let open = 0;
      let overdue = 0;
      const now = new Date();
      snap.forEach(doc => {
        const t = doc.data();
        if (t.status !== "completed" && t.status !== "approved" && t.status !== "cancelled") {
          open++;
          if (t.dueDate && t.dueDate.toDate() < now) overdue++;
        }
      });
      setStats(prev => ({ ...prev, openTasks: open, overdueTasks: overdue }));
    });

    // 4. Reports
    const unsubReports = onSnapshot(collection(getFirebaseDb() as any, "reports"), (snap) => {
      let pending = 0;
      let approved = 0;
      snap.forEach(doc => {
        const r = doc.data();
        if (r.status === "submitted" || r.status === "under_review") pending++;
        if (r.status === "approved") approved++;
      });
      setStats(prev => ({ ...prev, pendingReports: pending, approvedReports: approved }));
    });

    // 5. Activity Feed
    const unsubActivity = onSnapshot(
      query(collection(getFirebaseDb() as any, "activity_feed"), orderBy("timestamp", "desc"), limit(10)),
      (snap) => {
        setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as ActivityFeed)));
        setLoading(false);
      }
    );

    return () => {
      unsubUsers();
      unsubAttendance();
      unsubTasks();
      unsubReports();
      unsubActivity();
    };
  }, [userData]);

  // Recalculate absent if totalStaff changes after attendance loaded
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      absentToday: Math.max(0, prev.totalStaff - prev.presentToday)
    }));
  }, [stats.totalStaff, stats.presentToday]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Enterprise Dashboard...</div>;

  return (
    <AuthGuard requiredRole="admin">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3D91] flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-2" />
            Executive Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Real-time enterprise command center.</p>
        </div>

        {/* Enterprise KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Total Staff" value={stats.totalStaff} icon={<Users className="w-5 h-5 text-blue-500" />} />
          <MetricCard title="Present Today" value={stats.presentToday} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
          <MetricCard title="Absent Today" value={stats.absentToday} icon={<AlertCircle className="w-5 h-5 text-red-500" />} />
          <MetricCard title="Late Arrivals" value={stats.lateArrivals} icon={<Clock className="w-5 h-5 text-orange-500" />} />
          
          <MetricCard title="Open Tasks" value={stats.openTasks} icon={<TrendingUp className="w-5 h-5 text-indigo-500" />} />
          <MetricCard title="Overdue Tasks" value={stats.overdueTasks} icon={<AlertCircle className="w-5 h-5 text-rose-500" />} />
          <MetricCard title="Pending Reports" value={stats.pendingReports} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
          <MetricCard title="Approved Reports" value={stats.approvedReports} icon={<FileText className="w-5 h-5 text-teal-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Area: Rankings / Top Performers */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-900">Department Rankings</h3>
                <p className="text-xs text-slate-500">Live overall KPI scores across all departments.</p>
              </div>
              <div className="p-5">
                {/* Mocked data for MVP */}
                <div className="space-y-4">
                  <RankingRow name="Marketing" score={94} rank={1} />
                  <RankingRow name="Developer" score={88} rank={2} />
                  <RankingRow name="Customer Care" score={82} rank={3} />
                  <RankingRow name="Administration" score={79} rank={4} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-900">Top Performers</h3>
                <p className="text-xs text-slate-500">Top 5 staff members based on attendance, reports, and tasks.</p>
              </div>
              <div className="p-5 text-center text-slate-500 text-sm">
                Top performers widget will populate at the end of the month based on KPI aggregations.
              </div>
            </div>
          </div>

          {/* Sidebar: Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-slate-900">Enterprise Activity</h3>
              <p className="text-xs text-slate-500">Live operational feed.</p>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {activities.length > 0 ? activities.map(act => (
                <div key={act.feedId || Math.random()} className="flex space-x-3 text-sm">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#0A3D91]"></div>
                  </div>
                  <div>
                    <p className="text-slate-900">
                      <span className="font-semibold">{act.userName}</span> {act.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {act.department.replace('_', ' ')} • {act.timestamp ? new Date(act.timestamp.toDate()).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-slate-500 text-sm">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

const MetricCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
  </div>
);

const RankingRow = ({ name, score, rank }: { name: string, score: number, rank: number }) => (
  <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
    <div className="flex items-center space-x-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-200 text-slate-700' : rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
        #{rank}
      </div>
      <span className="font-medium text-slate-900">{name}</span>
    </div>
    <div className="flex items-center space-x-3">
      <div className="w-32 bg-slate-100 rounded-full h-2">
        <div className="bg-[#0A3D91] h-2 rounded-full" style={{ width: `${score}%` }}></div>
      </div>
      <span className="text-sm font-bold text-slate-700 w-8 text-right">{score}%</span>
    </div>
  </div>
);
