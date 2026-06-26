"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { SystemAlert } from "@/types";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function AlertsFeed() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    const db = getFirebaseDb();
    if (!db) return;
    const q = query(collection(db, "system_alerts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemAlert)));
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const resolveAlert = async (id: string) => {
    const db = getFirebaseDb();
    if (!db) return;
    await updateDoc(doc(db, "system_alerts", id), { resolved: true });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
          <AlertCircle className="w-8 h-8 mr-3 text-red-500" />
          System Risk Alerts
        </h1>
        <p className="text-slate-500 mt-1">Manage automated warnings for workforce and operational risks.</p>
      </div>
      
      <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No alerts generated yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map(alert => (
              <li key={alert.id} className={`p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center ${alert.resolved ? 'bg-slate-50 opacity-75' : 'bg-white'}`}>
                <div>
                  <div className="flex items-center mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.severity}
                    </span>
                    {alert.resolved && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-green-100 text-green-700">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className={`font-medium ${alert.resolved ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{alert.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(alert.createdAt.toDate()).toLocaleString()}</p>
                </div>
                {!alert.resolved && (
                  <button 
                    onClick={() => resolveAlert(alert.id!)}
                    className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-slate-100 text-slate-700 hover:bg-green-100 hover:text-green-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Resolved
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
