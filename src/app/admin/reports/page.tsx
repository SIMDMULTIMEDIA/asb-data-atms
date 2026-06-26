"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, doc, writeBatch } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Report } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { sendNotification } from "@/services/notifications";
import { logActivity } from "@/services/logger";
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Download } from "lucide-react";
import Link from "next/link";

export default function AdminReportsDashboard() {
  const { userData } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  useEffect(() => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return;
    }

    const q = query(
      collection(getFirebaseDb() as any, "reports"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedReports(reports.map(r => r.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelect = (id: string) => {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(rId => rId !== id));
    } else {
      setSelectedReports([...selectedReports, id]);
    }
  };

  const handleBulkAction = async (action: "approved" | "rejected" | "correction_requested") => {
    if (selectedReports.length === 0 || !userData) return;
    
    if (!confirm(`Are you sure you want to mark ${selectedReports.length} reports as ${action.replace('_', ' ')}?`)) return;

    try {
      const batch = writeBatch(getFirebaseDb() as any);
      
      for (const id of selectedReports) {
        const reportRef = doc(getFirebaseDb() as any, "reports", id);
        batch.update(reportRef, { status: action });
        
        const report = reports.find(r => r.id === id);
        if (report) {
          await sendNotification(
            report.userId,
            `Report ${action.replace('_', ' ')}`,
            `Your report ${report.reportNumber} has been ${action.replace('_', ' ')}.`,
            "report",
            action === "correction_requested" ? "high" : "medium"
          );
        }
      }
      
      await batch.commit();
      
      await logActivity(userData.uid, `bulk_${action}`, "all");
      setSelectedReports([]);
      
    } catch (err) {
      console.error("Bulk action failed:", err);
      alert("Failed to perform bulk action.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading admin dashboard...</div>;

  const totalReports = reports.length;
  const pendingReviews = reports.filter(r => r.status === "submitted" || r.status === "under_review").length;
  const approvedCount = reports.filter(r => r.status === "approved").length;
  const rejectedCount = reports.filter(r => r.status === "rejected").length;
  const correctionCount = reports.filter(r => r.status === "correction_requested").length;

  return (
    <AuthGuard>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A3D91]">Enterprise Review Panel</h1>
          <p className="text-slate-600">Monitor and manage all departmental reports.</p>
        </div>

        {/* Admin Analytics Widget */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <MetricCard title="Total Reports" value={totalReports} icon={<FileText className="w-5 h-5 text-blue-500" />} />
          <MetricCard title="Pending Reviews" value={pendingReviews} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
          <MetricCard title="Approved" value={approvedCount} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
          <MetricCard title="Corrections" value={correctionCount} icon={<AlertCircle className="w-5 h-5 text-orange-500" />} />
          <MetricCard title="Rejected" value={rejectedCount} icon={<XCircle className="w-5 h-5 text-red-500" />} />
        </div>

        {/* Bulk Actions */}
        {selectedReports.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
            <span className="text-sm font-medium text-blue-800">{selectedReports.length} reports selected</span>
            <div className="flex space-x-2">
              <button onClick={() => handleBulkAction("approved")} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">Approve</button>
              <button onClick={() => handleBulkAction("correction_requested")} className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600">Request Correction</button>
              <button onClick={() => handleBulkAction("rejected")} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">Reject</button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 w-12 text-center">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedReports.length === reports.length && reports.length > 0} className="w-4 h-4 text-[#0A3D91] rounded border-slate-300" />
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Report ID</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedReports.includes(report.id)} 
                        onChange={() => handleSelect(report.id)}
                        className="w-4 h-4 text-[#0A3D91] rounded border-slate-300"
                      />
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-900">{report.reportNumber || "N/A"}</td>
                    <td className="p-4 text-sm text-slate-600 capitalize">{report.department.replace('_', ' ')}</td>
                    <td className="p-4 text-sm text-slate-600 capitalize">{report.reportType.replace('_', ' ')}</td>
                    <td className="p-4 text-sm">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      <div className="flex items-center space-x-2">
                        <span>{report.createdAt ? new Date(report.createdAt.toDate()).toLocaleDateString() : "-"}</span>
                        {report.submittedLate && <span className="text-red-500 text-[10px] bg-red-100 px-1.5 py-0.5 rounded font-bold">LATE</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-right">
                      <Link href={`/admin/reports/${report.id}`} className="text-[#0A3D91] hover:underline font-medium">Review</Link>
                    </td>
                  </tr>
                ))}
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
