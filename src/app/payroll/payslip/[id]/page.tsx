"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PayrollRecord } from "@/types";
import { ArrowLeft, Printer, Building } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PayslipView() {
  const params = useParams();
  const id = params.id as string;
  
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<PayrollRecord | null>(null);

  useEffect(() => {
    if (!id || !userData) return;
    
    const fetchRecord = async () => {
      const db = getFirebaseDb();
      if (!db) return;
      const snap = await getDoc(doc(db, "payroll_records", id));
      if (snap.exists()) {
        const data = snap.data() as PayrollRecord;
        // Verify authorization
        if (data.employeeId === userData.uid || userData.role === "admin" || userData.role === "super_admin") {
          setRecord(data);
        }
      }
      setLoading(false);
    };
    fetchRecord();
  }, [id, userData]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => `₦${(val || 0).toLocaleString()}`;

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading payslip...</div>;
  }

  if (!record) {
    return <div className="p-8 text-center text-red-500 font-bold">Payslip not found or access denied.</div>;
  }

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        
        {/* Hidden when printing */}
        <div className="flex justify-between items-center print:hidden">
          <Link href="/payroll" className="inline-flex items-center text-slate-500 hover:text-[#0A3D91]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payroll
          </Link>
          <button 
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-[#0A3D91] text-white rounded-lg hover:bg-[#082a63] transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Payslip
          </button>
        </div>

        {/* Payslip Document (Optimized for Print) */}
        <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-[#0A3D91] pb-6 mb-6">
            <div className="flex items-center">
              <Building className="w-10 h-10 text-[#0A3D91] mr-3" />
              <div>
                <h1 className="text-2xl font-black text-[#0A3D91] tracking-tight">ASB DATA ATMS</h1>
                <p className="text-sm text-slate-500">Official Payslip</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900 text-lg">{record.payrollPeriod}</p>
              <p className="text-sm text-slate-500">Ref: {record.payrollNumber}</p>
              <p className="text-sm text-slate-500 uppercase mt-1 px-2 py-0.5 bg-slate-100 rounded inline-block font-bold">
                {record.status}
              </p>
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Employee Name</p>
              <p className="font-bold text-slate-900 text-lg">{record.employeeName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Employee ID</p>
              <p className="font-medium text-slate-900">{record.employeeId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Department</p>
              <p className="font-medium text-slate-900 capitalize">{record.department.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Payment Date</p>
              <p className="font-medium text-slate-900">{record.createdAt.toDate().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Earnings */}
            <div>
              <h3 className="font-bold text-[#0A3D91] border-b border-slate-200 pb-2 mb-3 uppercase text-sm tracking-wider">Earnings</h3>
              <ul className="space-y-3">
                <li className="flex justify-between text-sm">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-medium text-slate-900">{formatCurrency(record.baseSalary)}</span>
                </li>
                {record.allowances > 0 && (
                  <li className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Allowances</span>
                    <span className="font-medium text-slate-900">{formatCurrency(record.allowances)}</span>
                  </li>
                )}
                {record.bonuses > 0 && (
                  <li className="flex justify-between text-sm">
                    <span className="text-slate-600">Performance Bonuses</span>
                    <span className="font-medium text-slate-900">{formatCurrency(record.bonuses)}</span>
                  </li>
                )}
                {record.commissions > 0 && (
                  <li className="flex justify-between text-sm">
                    <span className="text-slate-600">Commissions</span>
                    <span className="font-medium text-slate-900">{formatCurrency(record.commissions)}</span>
                  </li>
                )}
              </ul>
              <div className="flex justify-between text-sm font-bold mt-4 pt-3 border-t border-slate-200 bg-slate-50 p-2 rounded">
                <span className="text-slate-900">Total Gross</span>
                <span className="text-[#0A3D91]">{formatCurrency(record.grossPay)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="font-bold text-red-600 border-b border-slate-200 pb-2 mb-3 uppercase text-sm tracking-wider">Deductions</h3>
              <ul className="space-y-3">
                {record.deductions > 0 ? (
                  <li className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Deductions</span>
                    <span className="font-medium text-red-600">-{formatCurrency(record.deductions)}</span>
                  </li>
                ) : (
                  <li className="text-sm text-slate-400 italic">No deductions for this period.</li>
                )}
              </ul>
              <div className="flex justify-between text-sm font-bold mt-4 pt-3 border-t border-slate-200 bg-red-50 p-2 rounded">
                <span className="text-slate-900">Total Deductions</span>
                <span className="text-red-600">-{formatCurrency(record.deductions)}</span>
              </div>
            </div>

          </div>

          {/* Net Pay */}
          <div className="bg-[#0A3D91] rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-center print:bg-slate-100 print:text-[#0A3D91] print:border-2 print:border-[#0A3D91]">
            <div>
              <h2 className="text-lg font-bold text-blue-200 print:text-slate-600 uppercase tracking-wider">Net Pay</h2>
              <p className="text-sm text-blue-100 print:text-slate-500 mt-1">Amount transferred to salary account</p>
            </div>
            <div className="text-4xl font-black mt-4 md:mt-0">
              {formatCurrency(record.netPay)}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-slate-400 border-t border-slate-100 pt-6">
            <p>This is a system generated document. No signature is required.</p>
            <p className="mt-1">Generated at: {new Date().toLocaleString()}</p>
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
