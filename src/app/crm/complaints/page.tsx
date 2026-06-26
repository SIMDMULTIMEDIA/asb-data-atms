"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CustomerComplaint } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ComplaintManagementBoard() {
  const { userData } = useAuth();
  const [complaints, setComplaints] = useState<CustomerComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) return;

    const q = query(collection(getFirebaseDb() as any, "customer_complaints"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerComplaint));
      
      // Filter for non-admins based on assigned department or user
      if (userData.role !== 'admin' && userData.role !== 'super_admin') {
        data = data.filter(c => 
          c.assignedTo === userData.uid || 
          c.assignedDepartment === userData.department
        );
      }
      
      setComplaints(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Complaints...</div>;

  const openComplaints = complaints.filter(c => c.status === "open" || c.status === "assigned" || c.status === "in_progress");
  const resolvedComplaints = complaints.filter(c => c.status === "resolved" || c.status === "closed");

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A3D91] flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Complaint Management
          </h1>
          <p className="text-slate-600 mt-1">Manage, assign, and resolve customer issues.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Queue */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-500" />
                Active Queue ({openComplaints.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {openComplaints.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
                  <p>No active complaints.</p>
                </div>
              ) : (
                openComplaints.map(complaint => (
                  <ComplaintCard key={complaint.id} complaint={complaint} />
                ))
              )}
            </div>
          </div>

          {/* Resolved/Closed */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden opacity-75">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Recently Resolved ({resolvedComplaints.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {resolvedComplaints.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p>No resolved complaints yet.</p>
                </div>
              ) : (
                resolvedComplaints.map(complaint => (
                  <ComplaintCard key={complaint.id} complaint={complaint} isResolved />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

const ComplaintCard = ({ complaint, isResolved = false }: { complaint: CustomerComplaint, isResolved?: boolean }) => {
  return (
    <div className={`p-5 hover:bg-slate-50 transition-colors ${isResolved ? 'bg-slate-50/50' : 'bg-white'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{complaint.complaintNumber}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            complaint.priority === 'critical' ? 'bg-red-100 text-red-700' :
            complaint.priority === 'high' ? 'bg-orange-100 text-orange-700' :
            complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {complaint.priority}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            isResolved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {complaint.status.replace('_', ' ')}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {complaint.createdAt ? new Date(complaint.createdAt.toDate()).toLocaleDateString() : ""}
        </span>
      </div>
      
      <h4 className="text-sm font-bold text-slate-900 mb-1">{complaint.title}</h4>
      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{complaint.description}</p>
      
      <div className="flex justify-between items-center text-xs font-medium">
        <div className="text-slate-500">
          Dept: <span className="capitalize">{complaint.assignedDepartment.replace('_', ' ')}</span>
        </div>
        <Link 
          href={`/crm/customers/${complaint.customerId}`} 
          className="text-[#0A3D91] hover:text-[#082a63]"
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
};
