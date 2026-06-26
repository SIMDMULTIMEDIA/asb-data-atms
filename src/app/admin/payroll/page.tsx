"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, doc, setDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PayrollRecord, PayrollPeriod, CompanySettings } from "@/types";
import { generatePayrollForPeriod } from "@/services/payroll";
import { getCompanySettings } from "@/services/settings";
import { DollarSign, Settings, Lock, CheckCircle, FileText, UserPlus, Download, Check } from "lucide-react";
import Link from "next/link";

export default function AdminPayrollDashboard() {
  const { userData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-06");

  useEffect(() => {
    if (!userData) return;

    const loadData = async () => {
      const s = await getCompanySettings();
      setSettings(s);
    };
    loadData();

    const db = getFirebaseDb();
    if (!db) return;

    const unsubPeriods = onSnapshot(query(collection(db, "payroll_periods"), orderBy("createdAt", "desc")), (snap) => {
      setPeriods(snap.docs.map(d => ({ id: d.id, ...d.data() } as PayrollPeriod)));
    });

    return () => {
      unsubPeriods();
    };
  }, [userData]);

  useEffect(() => {
    if (!selectedPeriod) return;
    const db = getFirebaseDb();
    if (!db) return;

    const unsubRecords = onSnapshot(
      query(collection(db, "payroll_records"), orderBy("createdAt", "desc")), 
      (snap) => {
        setRecords(snap.docs.map(d => d.data() as PayrollRecord).filter(r => r.payrollPeriod === selectedPeriod));
        setLoading(false);
      }
    );
    return () => unsubRecords();
  }, [selectedPeriod]);

  const handleGeneratePayroll = async () => {
    if (!userData || !selectedPeriod) return;
    
    const p = periods.find(p => p.id === selectedPeriod);
    if (p && ["approved", "paid", "closed"].includes(p.status)) {
      setError(`Payroll for ${selectedPeriod} is locked.`);
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const log = await generatePayrollForPeriod(selectedPeriod, userData.uid);
      if (!log) throw new Error("Firestore unavailable");
      setSuccess(`Successfully generated payroll for ${log.totalEmployees} employees.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate payroll.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprovePayroll = async () => {
    if (!userData || !selectedPeriod) return;
    try {
      const db = getFirebaseDb();
      if (!db) return;
      const ref = doc(db, "payroll_periods", selectedPeriod);
      await setDoc(ref, { status: "approved" }, { merge: true });
      
      const auditRef = doc(collection(db, "payroll_audit_logs"));
      await setDoc(auditRef, {
        id: auditRef.id,
        generatedBy: userData.uid,
        generatedAt: Timestamp.now(),
        periodId: selectedPeriod,
        action: "status_change",
        changes: [{ field: "status", oldValue: "generated", newValue: "approved" }]
      });
      setSuccess("Payroll Approved and Locked.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const exportCSV = () => {
    const headers = ["EmployeeName", "Department", "BaseSalary", "Allowances", "Bonuses", "Commissions", "Deductions", "NetPay"];
    const rows = records.map(r => [
      r.employeeName,
      r.department,
      r.baseSalary,
      r.allowances,
      r.bonuses,
      r.commissions,
      r.deductions,
      r.netPay
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentPeriod = periods.find(p => p.id === selectedPeriod);
  const isLocked = currentPeriod && ["approved", "paid", "closed"].includes(currentPeriod.status);
  const statusLabel = currentPeriod ? currentPeriod.status : "draft";

  const totalGross = records.reduce((sum, r) => sum + r.grossPay, 0);
  const totalNet = records.reduce((sum, r) => sum + r.netPay, 0);

  const formatCurrency = (val: number) => `₦${(val || 0).toLocaleString()}`;

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D91] flex items-center">
              <DollarSign className="w-6 h-6 mr-2" />
              Payroll Management
            </h1>
            <p className="text-slate-600 mt-1">Generate, approve, and export payroll.</p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/admin/payroll/compensation" className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
              <UserPlus className="w-4 h-4 mr-2" /> Compensation
            </Link>
            <button onClick={exportCSV} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">{error}</div>}
        {success && <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 font-medium flex items-center"><CheckCircle className="w-5 h-5 mr-2" />{success}</div>}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Period</label>
              <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91] font-medium">
                <option value="2026-05">May 2026</option>
                <option value="2026-06">June 2026</option>
                <option value="2026-07">July 2026</option>
              </select>
            </div>
            
            <div className="pt-5 flex space-x-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold uppercase ${isLocked ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                {isLocked ? <Lock className="w-4 h-4 mr-1.5" /> : <FileText className="w-4 h-4 mr-1.5" />}
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button onClick={handleGeneratePayroll} disabled={generating || isLocked} className={`flex items-center px-6 py-3 rounded-xl font-bold text-white transition-colors ${generating || isLocked ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0A3D91] hover:bg-[#082a63]'}`}>
              <FileText className="w-5 h-5 mr-2" />
              {generating ? "Generating..." : "Generate Draft"}
            </button>
            {statusLabel === "generated" && (
              <button onClick={handleApprovePayroll} className="flex items-center px-6 py-3 rounded-xl font-bold text-white transition-colors bg-green-600 hover:bg-green-700">
                <Check className="w-5 h-5 mr-2" /> Approve & Lock
              </button>
            )}
          </div>
        </div>

        {records.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Employees</div>
              <div className="text-3xl font-bold text-slate-900">{records.length}</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Gross Payroll</div>
              <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalGross)}</div>
            </div>
            <div className="bg-[#0A3D91] p-5 rounded-xl shadow-sm text-white">
              <div className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-1">Total Net Payout</div>
              <div className="text-3xl font-bold">{formatCurrency(totalNet)}</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900">Payroll Records ({selectedPeriod})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Base + Allowances</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Bonuses</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Commissions</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Net Pay</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No records found.</td></tr>
                ) : (
                  records.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{record.employeeName}</div>
                        <div className="text-xs text-slate-500 capitalize">{record.department.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{formatCurrency(record.baseSalary + record.allowances)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{formatCurrency(record.bonuses)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{formatCurrency(record.commissions)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{formatCurrency(record.deductions)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(record.netPay)}</td>
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
