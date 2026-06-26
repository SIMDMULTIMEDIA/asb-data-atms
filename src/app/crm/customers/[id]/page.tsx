"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, use } from "react";
import { doc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Customer, CustomerInteraction, CustomerComplaint } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { addCustomerInteraction, updateCustomer } from "@/services/crm";
import { ArrowLeft, User, Phone, Mail, MapPin, Activity, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  const { userData } = useAuth();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [complaints, setComplaints] = useState<CustomerComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Interaction Form
  const [interactionType, setInteractionType] = useState<CustomerInteraction["type"]>("call");
  const [interactionOutcome, setInteractionOutcome] = useState<CustomerInteraction["outcome"]>("contacted");
  const [interactionNotes, setInteractionNotes] = useState("");
  const [submittingInt, setSubmittingInt] = useState(false);

  useEffect(() => {
    if (!userData || !customerId) return;

    const unsubCustomer = onSnapshot(doc(getFirebaseDb() as any, "customers", customerId), (docSnap) => {
      if (docSnap.exists()) {
        setCustomer({ id: docSnap.id, ...docSnap.data() } as Customer);
      } else {
        router.push("/crm/customers");
      }
      setLoading(false);
    });

    const unsubInteractions = onSnapshot(
      query(collection(getFirebaseDb() as any, "customer_interactions"), where("customerId", "==", customerId), orderBy("createdAt", "desc")),
      (snap) => {
        setInteractions(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerInteraction)));
      }
    );

    const unsubComplaints = onSnapshot(
      query(collection(getFirebaseDb() as any, "customer_complaints"), where("customerId", "==", customerId), orderBy("createdAt", "desc")),
      (snap) => {
        setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerComplaint)));
      }
    );

    return () => {
      unsubCustomer();
      unsubInteractions();
      unsubComplaints();
    };
  }, [customerId, userData, router]);

  const handleStatusChange = async (newStatus: Customer["status"]) => {
    if (!customer) return;
    try {
      await updateCustomer(customerId, { status: newStatus });
      // If converting a lead to an active customer, automatically log an interaction
      if (customer.status === "lead" && newStatus === "active" && userData) {
        await addCustomerInteraction({
          customerId,
          staffId: userData.uid,
          type: "call",
          outcome: "converted",
          notes: "Automatically logged: Lead converted to Active Customer."
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !interactionNotes.trim()) return;
    setSubmittingInt(true);
    try {
      await addCustomerInteraction({
        customerId,
        staffId: userData.uid,
        type: interactionType,
        outcome: interactionOutcome,
        notes: interactionNotes
      });
      setInteractionNotes("");
      
      // If outcome is converted, automatically update customer status
      if (interactionOutcome === "converted" && customer?.status === "lead") {
        await updateCustomer(customerId, { status: "active" });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add interaction.");
    } finally {
      setSubmittingInt(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Customer...</div>;
  if (!customer) return null;

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <Link href="/crm/customers" className="inline-flex items-center text-slate-500 hover:text-[#0A3D91]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Link>

        {/* Header Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#0A3D91] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {customer.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{customer.fullName}</h1>
                <p className="text-sm text-slate-500 mb-2">{customer.customerNumber} • Source: <span className="capitalize">{customer.source.replace('_', ' ')}</span></p>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <div className="flex items-center"><Phone className="w-4 h-4 mr-1.5" /> {customer.phoneNumber}</div>
                  {customer.email && <div className="flex items-center"><Mail className="w-4 h-4 mr-1.5" /> {customer.email}</div>}
                  {customer.address && <div className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {customer.address}</div>}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase ${
                customer.status === 'active' ? 'bg-green-100 text-green-800' : 
                customer.status === 'lead' ? 'bg-blue-100 text-blue-800' : 
                'bg-slate-100 text-slate-800'
              }`}>
                {customer.status}
              </span>
              
              <div className="flex gap-2">
                {customer.status === "lead" && (
                  <button 
                    onClick={() => handleStatusChange("active")}
                    className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                  >
                    Mark as Converted
                  </button>
                )}
                <button 
                  onClick={() => handleStatusChange(customer.status === "inactive" ? "active" : "inactive")}
                  className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  {customer.status === "inactive" ? "Reactivate" : "Deactivate"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area: Interactions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-[#0A3D91]" />
                  Interaction History
                </h3>
              </div>
              
              {/* Interaction Form */}
              <div className="p-5 border-b border-slate-100 bg-white">
                <form onSubmit={handleAddInteraction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Interaction Type</label>
                      <select 
                        value={interactionType}
                        onChange={(e) => setInteractionType(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                      >
                        <option value="call">Phone Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                        <option value="message">Text Message</option>
                        <option value="visit">Physical Visit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Outcome</label>
                      <select 
                        value={interactionOutcome}
                        onChange={(e) => setInteractionOutcome(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                      >
                        <option value="contacted">Contacted (In Progress)</option>
                        <option value="converted">Converted (Won)</option>
                        <option value="lost">Lost / Uninterested</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                    <textarea 
                      required
                      value={interactionNotes}
                      onChange={(e) => setInteractionNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                      placeholder="What was discussed?"
                      rows={2}
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingInt}
                      className="px-4 py-2 bg-[#0A3D91] text-white rounded-lg text-sm font-medium hover:bg-[#082a63] transition-colors disabled:opacity-50"
                    >
                      {submittingInt ? "Logging..." : "Log Interaction"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Interaction List */}
              <div className="divide-y divide-slate-100">
                {interactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No interactions logged yet.</div>
                ) : (
                  interactions.map(interaction => (
                    <div key={interaction.id} className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                            interaction.outcome === 'converted' ? 'bg-green-100 text-green-700' :
                            interaction.outcome === 'lost' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {interaction.outcome.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-500 ml-3 capitalize">{interaction.type}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {interaction.createdAt ? new Date(interaction.createdAt.toDate()).toLocaleString() : "Just now"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{interaction.notes}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area: Complaints */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Complaints</h3>
                <Link href={`/crm/complaints/new?customerId=${customerId}`} className="text-xs font-medium text-[#0A3D91] hover:underline">
                  Log Issue
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {complaints.length === 0 ? (
                  <div className="p-5 text-center text-slate-500 text-sm">No complaints recorded.</div>
                ) : (
                  complaints.map(complaint => (
                    <div key={complaint.id} className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-900 truncate pr-2">{complaint.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          complaint.status === 'resolved' || complaint.status === 'closed' ? 'bg-green-100 text-green-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{complaint.description}</p>
                      <div className="mt-2 text-[10px] text-slate-400">
                        {complaint.createdAt ? new Date(complaint.createdAt.toDate()).toLocaleDateString() : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
