"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EmployeePerformance } from "@/types";
import { BarChart2, TrendingUp, Award, Users } from "lucide-react";

export default function AdminPerformanceDashboard() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performances, setPerformances] = useState<EmployeePerformance[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-06");

  useEffect(() => {
    if (!userData || !selectedPeriod) return;
    const db = getFirebaseDb();
    if (!db) return;

    const q = query(collection(db, "employee_performance"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => d.data() as EmployeePerformance);
      setPerformances(data.filter(p => p.month === selectedPeriod));
      setLoading(false);
    });

    return () => unsub();
  }, [userData, selectedPeriod]);

  const sortedByScore = [...performances].sort((a, b) => b.finalScore - a.finalScore);
  const topPerformers = sortedByScore.slice(0, 3);

  const avgScore = performances.length > 0 
    ? Math.round(performances.reduce((acc, curr) => acc + curr.finalScore, 0) / performances.length) 
    : 0;

  // Department averages
  const deptMap: Record<string, { total: number; count: number }> = {};
  performances.forEach(p => {
    if (!deptMap[p.department]) deptMap[p.department] = { total: 0, count: 0 };
    deptMap[p.department].total += p.finalScore;
    deptMap[p.department].count++;
  });
  
  const deptAverages = Object.entries(deptMap).map(([dept, data]) => ({
    department: dept,
    average: Math.round(data.total / data.count)
  })).sort((a, b) => b.average - a.average);

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D91] flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              Performance & KPI Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Review organizational performance and leaderboards.</p>
          </div>
          
          <select 
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91] font-medium"
          >
            <option value="2026-05">May 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="2026-07">July 2026</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center text-slate-500 mb-2">
              <Users className="w-5 h-5 mr-2" />
              <h3 className="font-bold">Total Staff Rated</h3>
            </div>
            <p className="text-4xl font-bold text-slate-900">{performances.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center text-slate-500 mb-2">
              <BarChart2 className="w-5 h-5 mr-2" />
              <h3 className="font-bold">Company Average KPI</h3>
            </div>
            <p className="text-4xl font-bold text-slate-900">{avgScore}%</p>
          </div>

          <div className="bg-gradient-to-br from-[#0A3D91] to-[#082a63] p-6 rounded-2xl shadow-sm text-white">
            <div className="flex items-center text-blue-200 mb-2">
              <Award className="w-5 h-5 mr-2" />
              <h3 className="font-bold">Top Department</h3>
            </div>
            <p className="text-3xl font-bold capitalize">
              {deptAverages.length > 0 ? deptAverages[0].department.replace('_', ' ') : 'N/A'}
            </p>
            {deptAverages.length > 0 && (
              <p className="text-blue-200 mt-1">{deptAverages[0].average}% Avg Score</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center">
              <Award className="w-5 h-5 text-amber-500 mr-2" />
              <h3 className="font-bold text-slate-900">Top Performers Leaderboard</h3>
            </div>
            <div className="p-0">
              {topPerformers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No performance records for this period.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {topPerformers.map((p, idx) => (
                    <li key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.userId}</p>
                          <p className="text-xs text-slate-500 capitalize">{p.department.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-[#0A3D91]">{p.finalScore}%</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Department Rankings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center">
              <BarChart2 className="w-5 h-5 text-[#0A3D91] mr-2" />
              <h3 className="font-bold text-slate-900">Department Rankings</h3>
            </div>
            <div className="p-0">
              {deptAverages.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No data available.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {deptAverages.map((dept, idx) => (
                    <li key={dept.department} className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-slate-400 font-medium mr-3">{idx + 1}.</span>
                        <span className="font-bold text-slate-700 capitalize">{dept.department.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-32 bg-slate-100 rounded-full h-2 mr-3">
                          <div className="bg-[#0A3D91] h-2 rounded-full" style={{ width: `${dept.average}%` }}></div>
                        </div>
                        <span className="font-bold text-slate-900 w-12 text-right">{dept.average}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}
