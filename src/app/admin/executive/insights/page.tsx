"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { ExecutiveInsight } from "@/types";
import { Lightbulb, TrendingUp } from "lucide-react";

export default function InsightsFeed() {
  const [insights, setInsights] = useState<ExecutiveInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    const db = getFirebaseDb();
    if (!db) return;
    const q = query(collection(db, "executive_insights"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setInsights(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExecutiveInsight)));
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
          <Lightbulb className="w-8 h-8 mr-3 text-[#0A3D91]" />
          AI Insights Feed
        </h1>
        <p className="text-slate-500 mt-1">Rule-based analytical observations for executives.</p>
      </div>
      
      <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading insights...</div>
        ) : insights.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No insights generated yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {insights.map(insight => (
              <li key={insight.id} className="p-4 md:p-6 flex items-start hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-[#0A3D91]" />
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-600">
                      {insight.category}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {new Date(insight.createdAt.toDate()).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-medium text-slate-900 text-lg leading-snug">{insight.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
