"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getExecutiveScorecard, checkAndGenerateAnalytics } from "@/services/analytics";
import { getLatestInsights } from "@/services/executive-insights";
import { useAuth } from "@/contexts/AuthContext";
import { SystemAlert, ExecutiveInsight } from "@/types";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { 
  Users, DollarSign, TrendingUp, Star, BarChart3, AlertCircle, Lightbulb
} from "lucide-react";
import dynamicImport from "next/dynamic";
import Link from "next/link";

const AttendanceChart = dynamicImport(
  () => import("@/components/charts/ExecutiveCharts").then((mod) => mod.AttendanceChart),
  { ssr: false }
);

const PayrollTrendChart = dynamicImport(
  () => import("@/components/charts/ExecutiveCharts").then((mod) => mod.PayrollTrendChart),
  { ssr: false }
);

// Mock Data for Charts
const attendanceTrend = [
  { name: 'Jan', rate: 82 }, { name: 'Feb', rate: 85 }, { name: 'Mar', rate: 84 },
  { name: 'Apr', rate: 88 }, { name: 'May', rate: 91 }, { name: 'Jun', rate: 94 },
];
const payrollTrend = [
  { name: 'Jan', cost: 12.5 }, { name: 'Feb', cost: 12.8 }, { name: 'Mar', cost: 13.0 },
  { name: 'Apr', cost: 13.2 }, { name: 'May', cost: 14.1 }, { name: 'Jun', cost: 14.5 },
];

export default function ExecutiveCommandCenter() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scorecard, setScorecard] = useState<any>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [insights, setInsights] = useState<ExecutiveInsight[]>([]);

  useEffect(() => {
    if (!userData) return;

    const loadDashboard = async () => {
      await checkAndGenerateAnalytics(userData.uid);
      const metrics = await getExecutiveScorecard();
      setScorecard(metrics);

      const fetchedInsights = await getLatestInsights(4);
      setInsights(fetchedInsights);

      const db = getFirebaseDb();
      if (db) {
        const qAlerts = query(
          collection(db, "system_alerts"), 
          where("resolved", "==", false),
          limit(4)
        );
        const alertSnap = await getDocs(qAlerts);
        setAlerts(alertSnap.docs.map(d => d.data() as SystemAlert));
      }
      setLoading(false);
    };

    loadDashboard();
  }, [userData]);

  const formatCurrency = (val: number) => `₦${(val || 0).toLocaleString()}`;

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Command Center...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
        <p className="text-slate-500 mt-1">High-level overview of company performance and health.</p>
      </div>

      {/* ROW 1: Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center">
            <Users className="w-3 h-3 mr-1" /> Total Staff
          </p>
          <p className="text-2xl font-black text-slate-900">{scorecard?.totalEmployees || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center">
            <DollarSign className="w-3 h-3 mr-1" /> Payroll Cost
          </p>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(scorecard?.totalPayrollCost)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center">
            <BarChart3 className="w-3 h-3 mr-1" /> Avg KPI
          </p>
          <p className="text-2xl font-black text-[#0A3D91]">{scorecard?.avgKPI || 0}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center">
            <Star className="w-3 h-3 mr-1" /> Avg CSAT
          </p>
          <p className="text-2xl font-black text-slate-900">{scorecard?.customerSatisfaction || 0}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> Conv. Rate
          </p>
          <p className="text-2xl font-black text-slate-900">{scorecard?.leadConversion || 0}%</p>
        </div>
      </div>

      {/* ROW 2: Alerts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Alerts Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50/50 rounded-t-xl">
            <h3 className="font-bold text-slate-900 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              Workforce Risk Alerts
            </h3>
            <Link href="/admin/executive/alerts" className="text-sm text-[#0A3D91] font-medium hover:underline">View All</Link>
          </div>
          <div className="p-4 flex-1">
            {alerts.length === 0 ? (
              <div className="text-center text-slate-500 py-8">No active alerts. System healthy.</div>
            ) : (
              <ul className="space-y-3">
                {alerts.map(alert => (
                  <li key={alert.id} className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(alert.createdAt.toDate()).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* AI Insights Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50 rounded-t-xl">
            <h3 className="font-bold text-slate-900 flex items-center">
              <Lightbulb className="w-5 h-5 text-[#0A3D91] mr-2" />
              AI Insights Engine
            </h3>
            <Link href="/admin/executive/insights" className="text-sm text-[#0A3D91] font-medium hover:underline">View All</Link>
          </div>
          <div className="p-4 flex-1">
            {insights.length === 0 ? (
              <div className="text-center text-slate-500 py-8">No recent insights generated.</div>
            ) : (
              <ul className="space-y-4">
                {insights.map(insight => (
                  <li key={insight.id} className="flex items-start">
                    <div className="w-8 h-8 rounded bg-[#0A3D91]/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-[#0A3D91]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{insight.summary}</p>
                      <p className="text-xs text-slate-400 mt-1 capitalize">{insight.category} • {new Date(insight.createdAt.toDate()).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Attendance Trend (6 Months)</h3>
          <div className="h-64 w-full">
            <AttendanceChart data={attendanceTrend} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Payroll Cost Trend (Millions ₦)</h3>
          <div className="h-64 w-full">
            <PayrollTrendChart data={payrollTrend} />
          </div>
        </div>
      </div>

    </div>
  );
}
