"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Customer } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Users, Plus, Search, UserCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CustomersDirectory() {
  const { userData } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!userData) return;

    // Based on rules: Admin/CustomerCare/DeptHead can read all (rules allow it, but we can filter client-side if needed)
    // Marketers only read their assigned, but for MVP let's fetch all and filter client side.
    // In production, we'd query `where("assignedTo", "==", userData.uid)` for marketers.
    
    let q = query(collection(getFirebaseDb() as any, "customers"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      
      // Client-side filter based on role for safety if rules don't catch list queries
      if (userData.role === 'marketer_contract' || userData.role === 'marketer_adhoc') {
        data = data.filter(c => c.assignedTo === userData.uid);
      }
      
      setCustomers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.customerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Customers...</div>;

  const canCreate = ['super_admin', 'admin', 'customer_care', 'marketer_contract', 'marketer_adhoc'].includes(userData?.role || '');

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D91] flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Customer Directory
            </h1>
            <p className="text-slate-600 mt-1">Manage your customers and leads.</p>
          </div>
          
          {canCreate && (
            <Link 
              href="/crm/customers/new" 
              className="flex items-center px-4 py-2 bg-[#0A3D91] text-white rounded-lg hover:bg-[#082a63] transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0A3D91] focus:border-[#0A3D91] sm:text-sm"
            placeholder="Search customers by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>No customers found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#0A3D91] flex items-center justify-center text-white font-bold">
                            {customer.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{customer.fullName}</div>
                            <div className="text-xs text-slate-500">{customer.customerNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{customer.phoneNumber}</div>
                        <div className="text-xs text-slate-500">{customer.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 capitalize">
                          {customer.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                          customer.status === 'active' ? 'bg-green-100 text-green-800' : 
                          customer.status === 'lead' ? 'bg-blue-100 text-blue-800' : 
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/crm/customers/${customer.id}`} className="text-[#0A3D91] hover:text-[#082a63]">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
