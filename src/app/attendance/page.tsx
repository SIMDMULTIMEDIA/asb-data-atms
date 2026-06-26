"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Attendance } from "@/types";
import { submitCheckOut } from "@/services/attendance";
import { Clock, MapPin, UserCheck, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function AttendanceDashboard() {
  const { userData } = useAuth();
  const [history, setHistory] = useState<Attendance[]>([]);
  const [activeSession, setActiveSession] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!userData) return;

    const q = query(
      collection(getFirebaseDb() as any, "attendance"),
      where("userId", "==", userData.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
      setHistory(records);
      
      const active = records.find(r => !r.checkOut);
      setActiveSession(active || null);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleCheckOut = async () => {
    if (!activeSession) return;
    setCheckingOut(true);
    try {
      await submitCheckOut(activeSession.id);
    } catch (err) {
      console.error(err);
      alert("Failed to check out.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading attendance...</div>;

  return (
    <AuthGuard>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A3D91]">Attendance</h1>
          <p className="text-slate-600">Manage your daily shift check-ins and history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Active Session Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 bg-[#0A3D91] text-white">
                <h2 className="text-lg font-semibold flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Current Status</span>
                </h2>
              </div>
              <div className="p-6">
                {activeSession ? (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 text-green-600 bg-green-50 p-3 rounded-lg">
                      <UserCheck className="w-6 h-6" />
                      <span className="font-semibold">Clocked In ({activeSession.shift} Shift)</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Check In Time:</span>
                        <span className="font-medium text-slate-900">{format(activeSession.checkIn.toDate(), "h:mm a")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-slate-900 capitalize">{activeSession.status}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckOut}
                      disabled={checkingOut}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      {checkingOut ? "Checking out..." : "Clock Out"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-2">
                      <AlertCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">You are not currently clocked in.</p>
                    
                    <Link href="/attendance/check-in" className="flex items-center justify-center space-x-2 w-full py-3 bg-[#0A3D91] hover:bg-[#082a63] text-white rounded-xl font-medium transition-colors">
                      <span>Clock In Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Recent Attendance</h2>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">No attendance history found.</div>
                ) : (
                  history.map(record => (
                    <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg bg-cover bg-center border border-slate-200`} style={{ backgroundImage: `url(${record.selfieUrl})` }} />
                        <div>
                          <p className="font-medium text-slate-900">{format(record.createdAt.toDate(), "EEEE, MMM d, yyyy")}</p>
                          <div className="text-sm text-slate-500 flex items-center space-x-2 mt-0.5">
                            <span className="capitalize">{record.shift} Shift</span>
                            <span>•</span>
                            <span>{format(record.checkIn.toDate(), "h:mm a")} - {record.checkOut ? format(record.checkOut.toDate(), "h:mm a") : "Active"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <StatusBadge status={record.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

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
    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStyles()}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
