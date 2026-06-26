"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createCustomer } from "@/services/crm";
import { logActivity } from "@/services/logger";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Save, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
  const { userData } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    source: "marketing" as const,
    status: "lead" as const
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    
    setSubmitting(true);
    setError("");

    try {
      // By default, marketers assign leads to themselves
      const assignedTo = ['marketer_contract', 'marketer_adhoc', 'customer_care'].includes(userData.role) ? userData.uid : undefined;
      
      const customerId = await createCustomer({
        ...formData,
        assignedTo
      });
      
      await logActivity(userData.uid, `created_customer_lead`, userData.department);
      
      router.push(`/crm/customers/${customerId}`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to create customer: " + err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <Link href="/crm/customers" className="inline-flex items-center text-slate-500 hover:text-[#0A3D91] mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Link>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A3D91]">New Customer / Lead</h1>
          <p className="text-slate-600">Enter the customer's details to log them into the CRM.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input 
                type="text" 
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
              <input 
                type="tel" 
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                placeholder="+1 234 567 890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                placeholder="john@example.com"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select 
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value as any})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
              >
                <option value="marketing">Marketing Campaign</option>
                <option value="referral">Referral</option>
                <option value="walk_in">Walk-in</option>
                <option value="website">Website</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91]"
              >
                <option value="lead">Lead (Not yet purchased)</option>
                <option value="active">Active Customer</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center px-6 py-2 bg-[#0A3D91] text-white rounded-lg font-medium hover:bg-[#082a63] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
