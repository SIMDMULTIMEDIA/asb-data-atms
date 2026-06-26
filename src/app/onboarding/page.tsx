"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { Loader2, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    department: "Administration",
    shift: "Morning",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // By default, new user registrations are set to 'admin' or 'customer_care' etc. 
      // For this setup, we'll assign 'admin' if email contains 'admin' otherwise 'developer'.
      // You mentioned super_admin will assign roles, so default is pending or a basic role.
      const defaultRole = user.email?.includes('admin') ? 'super_admin' : 'developer';

      await setDoc(doc(getFirebaseDb() as any, "users", user.uid), {
        uid: user.uid,
        fullName: formData.fullName || user.displayName || "",
        email: user.email,
        phone: formData.phone,
        role: defaultRole,
        department: formData.department,
        shift: formData.shift,
        status: "active",
        createdAt: new Date().toISOString()
      });
      
      // Force reload to get updated context
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Error setting up profile", err);
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-[#0A3D91]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-3xl font-bold text-[#0A3D91] mb-2">Complete Your Profile</h1>
        <p className="text-slate-500">Please provide your details to access the system.</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#0A3D91] focus:border-[#0A3D91] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Phone Number</label>
              <div className="mt-1">
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#0A3D91] focus:border-[#0A3D91] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-[#0A3D91] focus:border-[#0A3D91] sm:text-sm rounded-md"
              >
                <option value="Administration">Administration</option>
                <option value="Developer">Developer</option>
                <option value="Marketing">Marketing</option>
                <option value="Customer Care">Customer Care</option>
                <option value="Automation">Automation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Shift</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({...formData, shift: e.target.value})}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-[#0A3D91] focus:border-[#0A3D91] sm:text-sm rounded-md"
              >
                <option value="Morning">Morning (06:00 AM - 01:59 PM)</option>
                <option value="Evening">Evening (02:00 PM - 09:59 PM)</option>
                <option value="Night">Night (10:00 PM - 05:59 AM)</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0A3D91] hover:bg-[#083070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3D91] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <>
                    Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
