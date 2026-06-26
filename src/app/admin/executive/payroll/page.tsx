"use client";
export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const PayrollChart = dynamicImport(
  () => import("@/components/charts/PayrollChart"),
  { ssr: false }
);

const payrollData = [
  { name: 'Operations', base: 4000, bonus: 2400, comms: 2400 },
  { name: 'Marketing', base: 3000, bonus: 1398, comms: 2210 },
  { name: 'Customer Care', base: 2000, bonus: 9800, comms: 2290 },
  { name: 'Admin', base: 2780, bonus: 3908, comms: 2000 },
];

export default function PayrollAnalytics() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payroll Analytics</h1>
        <p className="text-slate-500 mt-1">Cost breakdowns and compensation trends.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-6">Department Payroll Breakdown</h3>
        <div className="h-80 w-full">
          <PayrollChart data={payrollData} />
        </div>
      </div>
    </div>
  );
}
