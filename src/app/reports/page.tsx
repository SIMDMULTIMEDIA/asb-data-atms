"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Report } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FileText, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import Link from "next/link";

export default function ReportsDashboard() {
  const { userData } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!userData) return;

    const q = query(
      collection(getFirebaseDb() as any, "reports"),
      where("userId", "==", userData.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      
      setReports(reportsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reports:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  // Metrics
  const submittedCount = reports.filter(r => r.status === "submitted").length;
  const approvedCount = reports.filter(r => r.status === "approved").length;
  const rejectedCount = reports.filter(r => r.status === "rejected").length;
  const pendingCount = reports.filter(r => r.status === "under_review" || r.status === "correction_requested").length;

  const filteredReports = reports.filter(r => filter === "all" || r.status === filter);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <AuthGuard>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D91]">My Reports</h1>
            <p className="text-slate-600">Track and manage your submitted reports.</p>
          </div>
          <Link href="/reports/new" className="flex items-center space-x-2 bg-[#0A3D91] hover:bg-[#082a63] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            <span>New Report</span>
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Submitted" value={submittedCount} icon={<FileText className="w-5 h-5 text-blue-500" />} />
          <MetricCard title="Pending Review" value={pendingCount} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
          <MetricCard title="Approved" value={approvedCount} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
          <MetricCard title="Rejected" value={rejectedCount} icon={<XCircle className="w-5 h-5 text-red-500" />} />
        </div>

        {/* Filters & List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2 bg-slate-50">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
            <FilterButton active={filter === "draft"} onClick={() => setFilter("draft")}>Drafts</FilterButton>
            <FilterButton active={filter === "submitted"} onClick={() => setFilter("submitted")}>Submitted</FilterButton>
            <FilterButton active={filter === "under_review"} onClick={() => setFilter("under_review")}>Under Review</FilterButton>
            <FilterButton active={filter === "approved"} onClick={() => setFilter("approved")}>Approved</FilterButton>
            <FilterButton active={filter === "correction_requested"} onClick={() => setFilter("correction_requested")}>Corrections</FilterButton>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No reports found</h3>
                <p className="text-slate-500 mt-1">You haven't created any reports matching this filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-medium text-slate-900">{report.reportNumber || "DRAFT"}</span>
                        <StatusBadge status={report.status} />
                      </div>
                      <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2">
                        <span className="capitalize">{report.reportType.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{report.shift} Shift</span>
                        <span>•</span>
                        <span>{report.createdAt ? formatDate(report.createdAt.toDate()) : "Unsaved"}</span>
                        {report.submittedLate && (
                          <>
                            <span>•</span>
                            <span className="text-red-500 font-medium">Late</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <Link href={`/reports/${report.id}`} className="text-sm font-medium text-[#0A3D91] hover:underline">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

const MetricCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
    <div className="p-3 bg-slate-50 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const FilterButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active ? "bg-[#0A3D91] text-white" : "text-slate-600 hover:bg-slate-200"
    }`}
  >
    {children}
  </button>
);

const StatusBadge = ({ status }: { status: string }) => {
  const getStyles = () => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "submitted": return "bg-blue-100 text-blue-700";
      case "under_review": return "bg-yellow-100 text-yellow-700";
      case "correction_requested": return "bg-orange-100 text-orange-700";
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
