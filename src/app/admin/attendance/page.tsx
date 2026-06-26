"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Attendance } from "@/types";
import { Users, Clock, AlertCircle, Calendar } from "lucide-react";
import { format, isToday } from "date-fns";

export default function AdminAttendanceDashboard() {
  const { userData } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return;
    }

    const q = query(
      collection(getFirebaseDb() as any, "attendance"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
      setAttendance(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading admin attendance...</div>;

  const todayRecords = attendance.filter(r => isToday(r.createdAt.toDate()));
  const checkedInToday = todayRecords.filter(r => r.status === "present" || r.status === "late").length;
  const lateArrivals = todayRecords.filter(r => r.status === "late").length;
  const earlyCheckouts = todayRecords.filter(r => r.status === "early_checkout").length;
  const absentStaff = 0; // Derived in future from schedules

  return (
    <AuthGuard>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A3D91]">Enterprise Attendance Panel</h1>
          <p className="text-slate-600">Monitor live staff check-ins, location data, and shift compliance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Checked In Today" value={checkedInToday} icon={<Users className="w-5 h-5 text-blue-500" />} />
          <MetricCard title="Late Arrivals" value={lateArrivals} icon={<AlertCircle className="w-5 h-5 text-orange-500" />} />
          <MetricCard title="Early Checkouts" value={earlyCheckouts} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
          <MetricCard title="Absent" value={absentStaff} icon={<Calendar className="w-5 h-5 text-red-500" />} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Live Roster</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff ID</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Shift</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check In</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check Out</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Selfie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No attendance records found.</td></tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-900">{record.userId}</td>
                      <td className="p-4 text-sm text-slate-600 capitalize">{record.shift}</td>
                      <td className="p-4 text-sm">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {format(record.checkIn.toDate(), "MMM d, h:mm a")}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {record.checkOut ? format(record.checkOut.toDate(), "MMM d, h:mm a") : <span className="text-blue-500 font-medium">Active</span>}
                      </td>
                      <td className="p-4 text-sm text-right">
                        <a href={record.selfieUrl} target="_blank" rel="noreferrer" className="text-[#0A3D91] hover:underline font-medium">
                          View
                        </a>
                      </td>
                    </tr>
                  ))
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

const StatusBadge = ({ status }: { status: string }) => {
  const getStyles = () => {
    switch (status) {
      case "present": return "bg-green-100 text-green-700";
      case "late": return "bg-red-100 text-red-700";
      case "early_checkout": return "bg-orange-100 text-orange-700";
      case "absent": return "bg-slate-200 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStyles()}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
