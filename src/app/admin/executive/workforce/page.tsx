"use client";
export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const WorkforceChart = dynamicImport(
  () => import("@/components/charts/WorkforceChart"),
  { ssr: false }
);

const deptData = [
  { name: 'Operations', score: 86 },
  { name: 'Marketing', score: 74 },
  { name: 'Customer Care', score: 91 },
  { name: 'Admin', score: 79 },
];

export default function WorkforceAnalytics() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workforce Analytics</h1>
        <p className="text-slate-500 mt-1">Deep dive into department productivity and employee performance.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-6">Department Health Score (%)</h3>
        <div className="h-80 w-full">
          <WorkforceChart data={deptData} />
        </div>
      </div>
    </div>
  );
}
