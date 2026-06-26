"use client";
export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const CRMChart = dynamicImport(
  () => import("@/components/charts/CRMChart"),
  { ssr: false }
);

const ratingsData = [
  { name: '5 Stars', value: 400 },
  { name: '4 Stars', value: 300 },
  { name: '3 Stars', value: 100 },
  { name: '2 Stars', value: 50 },
  { name: '1 Star', value: 20 },
];

export default function CRMAnalytics() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">CRM Analytics</h1>
        <p className="text-slate-500 mt-1">Lead conversion and customer satisfaction metrics.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full md:w-1/2">
        <h3 className="font-bold text-slate-900 mb-6">Customer Ratings Distribution</h3>
        <div className="h-80 w-full">
          <CRMChart data={ratingsData} />
        </div>
      </div>
    </div>
  );
}
