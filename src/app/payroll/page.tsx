"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PayrollRecord, EmployeePerformance } from "@/types";
import { DollarSign, FileText, CheckCircle, TrendingUp, Download } from "lucide-react";
import Link from "next/link";

export default function MyPayrollDashboard() {
  const { userData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [currentKpi, setCurrentKpi] = useState<EmployeePerformance | null>(null);

  useEffect(() => {
    if (!userData) return;
    const db = getFirebaseDb();
    if (!db) return;

    // Load Payroll Records
    const qRecords = query(
      collection(db, "payroll_records"), 
      where("employeeId", "==", userData.uid),
      orderBy("createdAt", "desc")
    );
    const unsubRecords = onSnapshot(qRecords, (snap) => {
      setRecords(snap.docs.map(d => d.data() as PayrollRecord));
      setLoading(false);
    });

    // Load current month KPI (assuming 2026-06 for demo context)
    const qKpi = query(
      collection(db, "employee_performance"),
      where("userId", "==", userData.uid),
      where("month", "==", "2026-06")
    );
    getDocs(qKpi).then(snap => {
      if (!snap.empty) {
        setCurrentKpi(snap.docs[0].data() as EmployeePerformance);
      }
    });

    return () => unsubRecords();
  }, [userData]);

  const formatCurrency = (val: number) => `₦${(val || 0).toLocaleString()}`;

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3D91] flex items-center">
            <DollarSign className="w-6 h-6 mr-2" />
            My Payroll & Performance
          </h1>
          <p className="text-slate-600 mt-1">View your compensation history and current KPI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center text-slate-500 mb-4">
              <TrendingUp className="w-5 h-5 mr-2" />
              <h3 className="font-bold">Current Month KPI (June 2026)</h3>
            </div>
            {currentKpi ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-600">Final Score</span>
                  <span className="font-bold text-2xl text-[#0A3D91]">{currentKpi.finalScore}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-500 block text-xs">Attendance</span>
                    <span className="font-bold">{currentKpi.attendanceScore}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-500 block text-xs">Tasks</span>
                    <span className="font-bold">{currentKpi.taskScore}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-500 block text-xs">Reports</span>
                    <span className="font-bold">{currentKpi.reportScore}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-500 block text-xs">CRM Rating</span>
                    <span className="font-bold">{currentKpi.customerRatingScore}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl">
                KPI not generated for this month yet.
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#0A3D91] to-[#082a63] p-6 rounded-2xl shadow-sm text-white">
            <div className="flex items-center text-blue-200 mb-4">
              <CheckCircle className="w-5 h-5 mr-2" />
              <h3 className="font-bold">Last Net Pay</h3>
            </div>
            {records.length > 0 ? (
              <div>
                <p className="text-4xl font-bold">{formatCurrency(records[0].netPay)}</p>
                <p className="text-blue-200 mt-2">For {records[0].payrollPeriod}</p>
              </div>
            ) : (
              <p className="text-blue-200">No payroll records found.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900">Payslip History</h3>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading records...</div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No payslips available yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {records.map(record => (
                  <li key={record.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="mb-4 md:mb-0">
                      <p className="font-bold text-slate-900 text-lg">{record.payrollPeriod}</p>
                      <p className="text-sm text-slate-500 flex items-center mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${record.status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        {record.status.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase font-bold">Net Pay</p>
                        <p className="font-bold text-[#0A3D91] text-lg">{formatCurrency(record.netPay)}</p>
                      </div>
                      <Link 
                        href={`/payroll/payslip/${record.id}`}
                        className="flex items-center px-4 py-2 bg-slate-100 text-[#0A3D91] hover:bg-slate-200 rounded-lg font-medium transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}
