"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { 
  getCompanySettings, updateCompanySettings,
  getKPIWeights, updateKPIWeights,
  getCommissionSettings, updateCommissionSettings,
  getPerformanceBonusRules, updatePerformanceBonusRules
} from "@/services/settings";
import { Save, Settings, DollarSign, Percent, Target } from "lucide-react";
import { CompanySettings, KPIWeights, CommissionSettings, PerformanceBonusRules } from "@/types";

export default function PayrollSettingsPage() {
  const { userData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [kpi, setKpi] = useState<KPIWeights | null>(null);
  const [commission, setCommission] = useState<CommissionSettings | null>(null);
  const [bonus, setBonus] = useState<PerformanceBonusRules | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const c = await getCompanySettings();
      const k = await getKPIWeights();
      const comm = await getCommissionSettings();
      const b = await getPerformanceBonusRules();
      
      setCompany(c);
      setKpi(k);
      setCommission(comm);
      setBonus(b);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSaveAll = async () => {
    if (!company || !kpi || !commission || !bonus) return;
    
    // Validate KPI weights equal 100
    const totalWeight = kpi.attendance + kpi.reports + kpi.tasks + kpi.customerRating + kpi.leadConversion;
    if (totalWeight !== 100) {
      setMessage(`Error: KPI Weights must total exactly 100. Current total: ${totalWeight}`);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await updateCompanySettings(company);
      await updateKPIWeights(kpi);
      await updateCommissionSettings(commission);
      await updatePerformanceBonusRules(bonus);
      setMessage("Settings saved successfully.");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving settings.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const updateBonusTier = (floor: string, amount: number) => {
    if (!bonus) return;
    setBonus({
      ...bonus,
      tiers: {
        ...bonus.tiers,
        [floor]: amount
      }
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Configuration...</div>;

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D91] flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Payroll & Performance Settings
            </h1>
            <p className="text-slate-600 mt-1">Configure global weights, commissions, and bonuses.</p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center px-6 py-2 bg-[#0A3D91] text-white rounded-lg font-medium hover:bg-[#082a63] transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Company Currency */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Currency Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency Code</label>
                <input 
                  type="text" 
                  value={company?.currency || ""}
                  onChange={e => setCompany({...company!, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
                <input 
                  type="text" 
                  value={company?.currencySymbol || ""}
                  onChange={e => setCompany({...company!, currencySymbol: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                />
              </div>
            </div>
          </div>

          {/* Commissions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-600" />
              Commission Payouts
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Conversion Payout ({company?.currencySymbol})</label>
                <input 
                  type="number" 
                  value={commission?.leadConversion || 0}
                  onChange={e => setCommission({...commission!, leadConversion: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Rating Bonus ({company?.currencySymbol})</label>
                <input 
                  type="number" 
                  value={commission?.customerRatingBonus || 0}
                  onChange={e => setCommission({...commission!, customerRatingBonus: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                />
              </div>
            </div>
          </div>

          {/* KPI Weights */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Percent className="w-5 h-5 mr-2 text-blue-600" />
              KPI Weightings (%)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Must total exactly 100.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attendance Weight</label>
                <input 
                  type="number" 
                  value={kpi?.attendance || 0}
                  onChange={e => setKpi({...kpi!, attendance: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reports Weight</label>
                <input 
                  type="number" 
                  value={kpi?.reports || 0}
                  onChange={e => setKpi({...kpi!, reports: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tasks Weight</label>
                <input 
                  type="number" 
                  value={kpi?.tasks || 0}
                  onChange={e => setKpi({...kpi!, tasks: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Rating Weight</label>
                <input 
                  type="number" 
                  value={kpi?.customerRating || 0}
                  onChange={e => setKpi({...kpi!, customerRating: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Conversion Weight</label>
                <input 
                  type="number" 
                  value={kpi?.leadConversion || 0}
                  onChange={e => setKpi({...kpi!, leadConversion: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>Total:</span>
              <span className={(kpi?.attendance || 0) + (kpi?.reports || 0) + (kpi?.tasks || 0) + (kpi?.customerRating || 0) + (kpi?.leadConversion || 0) === 100 ? "text-green-600" : "text-red-600"}>
                {(kpi?.attendance || 0) + (kpi?.reports || 0) + (kpi?.tasks || 0) + (kpi?.customerRating || 0) + (kpi?.leadConversion || 0)}%
              </span>
            </div>
          </div>

          {/* Bonus Rules */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
              Performance Bonus Tiers
            </h3>
            <p className="text-xs text-slate-500 mb-4">Bonuses paid based on overall KPI score reaching a specific floor.</p>
            <div className="space-y-4">
              {['60', '70', '80', '90'].map(floor => (
                <div key={floor} className="flex items-center space-x-4">
                  <span className="w-32 font-medium text-sm text-slate-700">Score {floor} - {Number(floor) + 9}:</span>
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">{company?.currencySymbol}</span>
                    </div>
                    <input 
                      type="number" 
                      value={bonus?.tiers[floor] || 0}
                      onChange={e => updateBonusTier(floor, Number(e.target.value))}
                      className="block w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center space-x-4 mt-2 pt-2 border-t border-slate-100">
                <span className="w-32 font-medium text-sm text-slate-700">Score 100:</span>
                <div className="flex-1 text-sm text-slate-500 italic">Uses Score 90 tier</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
