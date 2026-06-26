"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, where, orderBy, limit } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Customer, CustomerInteraction, CustomerComplaint, CustomerRating } from "@/types";
import { Users, TrendingUp, AlertTriangle, Star, CheckCircle, PieChart } from "lucide-react";

export default function CRMDashboard() {
  const { userData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeLeads: 0,
    convertedCustomers: 0,
    conversionRate: 0,
    averageRating: 0,
    openComplaints: 0,
    myLeads: 0,
    myConversions: 0,
    assignedComplaints: 0,
    resolvedToday: 0
  });

  const [recentRatings, setRecentRatings] = useState<CustomerRating[]>([]);

  useEffect(() => {
    if (!userData) return;

    // Based on role, we query differently or just aggregate overall data.
    const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
    const isMarketing = userData.role === 'marketer_contract' || userData.role === 'marketer_adhoc';
    const isCustomerCare = userData.role === 'customer_care';

    // 1. Customers
    const unsubCustomers = onSnapshot(collection(getFirebaseDb() as any, "customers"), (snap) => {
      let total = 0;
      let leads = 0;
      let converted = 0;
      let myL = 0;
      let myC = 0;
      
      snap.forEach(doc => {
        const c = doc.data() as Customer;
        total++;
        if (c.status === "lead") {
          leads++;
          if (c.assignedTo === userData.uid) myL++;
        }
        if (c.status === "active") {
          converted++;
          if (c.assignedTo === userData.uid) myC++;
        }
      });
      
      setStats(prev => ({ 
        ...prev, 
        totalCustomers: total, 
        activeLeads: leads,
        convertedCustomers: converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
        myLeads: myL,
        myConversions: myC
      }));
    });

    // 2. Complaints
    const unsubComplaints = onSnapshot(collection(getFirebaseDb() as any, "customer_complaints"), (snap) => {
      let open = 0;
      let assigned = 0;
      
      snap.forEach(doc => {
        const c = doc.data() as CustomerComplaint;
        if (c.status !== "resolved" && c.status !== "closed") {
          open++;
          if (c.assignedTo === userData.uid || c.assignedDepartment === userData.department) {
            assigned++;
          }
        }
      });
      setStats(prev => ({ ...prev, openComplaints: open, assignedComplaints: assigned }));
    });

    // 3. Ratings
    const unsubRatings = onSnapshot(query(collection(getFirebaseDb() as any, "customer_ratings"), orderBy("createdAt", "desc")), (snap) => {
      let sum = 0;
      let count = 0;
      
      snap.forEach(doc => {
        const r = doc.data() as CustomerRating;
        if (isAdmin || r.staffId === userData.uid || isCustomerCare) {
          sum += r.rating;
          count++;
        }
      });
      
      setStats(prev => ({ 
        ...prev, 
        averageRating: count > 0 ? Number((sum / count).toFixed(1)) : 0 
      }));
      
      setRecentRatings(snap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() } as CustomerRating)));
      setLoading(false);
    });

    return () => {
      unsubCustomers();
      unsubComplaints();
      unsubRatings();
    };
  }, [userData]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading CRM Dashboard...</div>;

  const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';
  const isMarketing = userData?.role === 'marketer_contract' || userData?.role === 'marketer_adhoc';
  const isCustomerCare = userData?.role === 'customer_care';

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3D91] flex items-center">
            <PieChart className="w-6 h-6 mr-2" />
            {isAdmin ? "Enterprise CRM Dashboard" : isMarketing ? "Marketing Dashboard" : isCustomerCare ? "Customer Care Dashboard" : "CRM Dashboard"}
          </h1>
          <p className="text-slate-600 mt-1">Live customer metrics and KPIs.</p>
        </div>

        {/* Dynamic KPI Cards Based on Role */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(isAdmin || isCustomerCare) && (
            <>
              <MetricCard title="Total Customers" value={stats.totalCustomers} icon={<Users className="w-5 h-5 text-blue-500" />} />
              <MetricCard title="Average Rating" value={`${stats.averageRating} / 5.0`} icon={<Star className="w-5 h-5 text-yellow-500" />} />
              <MetricCard title="Open Complaints" value={stats.openComplaints} icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} />
            </>
          )}

          {(isAdmin || isMarketing) && (
            <>
              <MetricCard title={isMarketing && !isAdmin ? "My Active Leads" : "Total Active Leads"} value={isMarketing && !isAdmin ? stats.myLeads : stats.activeLeads} icon={<TrendingUp className="w-5 h-5 text-indigo-500" />} />
              <MetricCard title={isMarketing && !isAdmin ? "My Conversions" : "Total Conversions"} value={isMarketing && !isAdmin ? stats.myConversions : stats.convertedCustomers} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
              <MetricCard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={<PieChart className="w-5 h-5 text-purple-500" />} />
            </>
          )}
          
          {isCustomerCare && !isAdmin && (
            <MetricCard title="Assigned Complaints" value={stats.assignedComplaints} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Recent Customer Ratings</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {recentRatings.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No ratings received yet.</div>
                ) : (
                  recentRatings.map(rating => (
                    <div key={rating.id} className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= rating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">
                          {rating.createdAt ? new Date(rating.createdAt.toDate()).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Source: <span className="capitalize font-normal text-slate-600">{rating.source.replace('_', ' ')}</span>
                      </p>
                      {rating.comment && (
                        <p className="text-sm text-slate-600 italic">"{rating.comment}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#0A3D91] to-[#082a63] rounded-xl shadow-sm text-white p-6">
              <h3 className="font-bold mb-2">Quick Actions</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="/crm/customers/new" className="hover:underline flex items-center"><TrendingUp className="w-4 h-4 mr-2" /> Add New Lead</a></li>
                <li><a href="/crm/customers" className="hover:underline flex items-center"><Users className="w-4 h-4 mr-2" /> View All Customers</a></li>
                <li><a href="/crm/complaints" className="hover:underline flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Manage Complaints</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

const MetricCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
  </div>
);
