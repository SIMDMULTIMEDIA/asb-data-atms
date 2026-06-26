"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getActiveCompensations, updateEmployeeCompensation } from "@/services/payroll";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EmployeeCompensation } from "@/types";
import { DollarSign, ArrowLeft, CheckCircle, Save, Loader2, Edit2 } from "lucide-react";
import Link from "next/link";

export default function CompensationManagement() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compensations, setCompensations] = useState<EmployeeCompensation[]>([]);
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmployeeCompensation>>({});

  useEffect(() => {
    if (!userData) return;
    loadData();
  }, [userData]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getActiveCompensations();
      setCompensations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comp: EmployeeCompensation) => {
    setEditingId(comp.employeeId);
    setEditForm({
      baseSalary: comp.baseSalary,
      transportAllowance: comp.transportAllowance,
      housingAllowance: comp.housingAllowance,
      mealAllowance: comp.mealAllowance,
      department: comp.department
    });
  };

  const handleSave = async (employeeId: string) => {
    if (!userData) return;
    setSaving(true);
    try {
      await updateEmployeeCompensation(employeeId, editForm, userData.uid);
      setMessage(`Compensation updated for ${employeeId}`);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setMessage("Failed to update: " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const formatCurrency = (val: number) => `₦${(val || 0).toLocaleString()}`;

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <Link href="/admin/payroll" className="inline-flex items-center text-slate-500 hover:text-[#0A3D91] mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Payroll
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold text-[#0A3D91] flex items-center">
            <DollarSign className="w-6 h-6 mr-2" />
            Compensation Management
          </h1>
          <p className="text-slate-600 mt-1">Manage base salaries and allowances securely.</p>
        </div>

        {message && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 font-medium flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Dept</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Base Salary</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Transport</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Housing</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Meal</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : compensations.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No active compensation records found.</td></tr>
                ) : (
                  compensations.map(comp => (
                    <tr key={comp.employeeId} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{comp.employeeId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">{comp.department}</td>
                      
                      {editingId === comp.employeeId ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <input type="number" className="w-24 px-2 py-1 border rounded" value={editForm.baseSalary} onChange={(e) => setEditForm({...editForm, baseSalary: Number(e.target.value)})} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <input type="number" className="w-24 px-2 py-1 border rounded" value={editForm.transportAllowance} onChange={(e) => setEditForm({...editForm, transportAllowance: Number(e.target.value)})} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <input type="number" className="w-24 px-2 py-1 border rounded" value={editForm.housingAllowance} onChange={(e) => setEditForm({...editForm, housingAllowance: Number(e.target.value)})} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <input type="number" className="w-24 px-2 py-1 border rounded" value={editForm.mealAllowance} onChange={(e) => setEditForm({...editForm, mealAllowance: Number(e.target.value)})} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button onClick={() => handleSave(comp.employeeId)} disabled={saving} className="text-green-600 hover:text-green-800 font-medium flex items-center justify-center mx-auto">
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(comp.baseSalary)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{formatCurrency(comp.transportAllowance)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{formatCurrency(comp.housingAllowance)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{formatCurrency(comp.mealAllowance)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button onClick={() => handleEdit(comp)} className="text-blue-600 hover:text-blue-800 font-medium">
                              <Edit2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </>
                      )}
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
