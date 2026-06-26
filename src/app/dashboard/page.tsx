"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  const { user, userData, signOut } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Simple Navbar for Phase 1 */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-[#0A3D91] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold tracking-tight text-sm">ASB</span>
            </div>
            <h1 className="font-semibold text-slate-800 text-lg">ATMS Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600 font-medium">
              {userData?.fullName || user?.email} <span className="text-xs px-2 py-1 bg-slate-100 rounded-full ml-2 uppercase text-slate-500">{userData?.role || 'User'}</span>
            </span>
            <button 
              onClick={signOut}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-[#0A3D91] mb-2">Welcome to ASB DATA ATMS</h2>
              <p className="text-slate-600 mb-6">
                You are successfully authenticated. This is the foundation of the dashboard. 
                In the next phase, we will implement role-specific widgets and modules here.
              </p>
              
              {userData?.role === 'super_admin' && (
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Developer Tools</h3>
                  <button 
                    onClick={async () => {
                      const { seedDepartments } = await import('@/services/departments');
                      const success = await seedDepartments();
                      if(success) alert('Departments seeded successfully');
                    }}
                    className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Seed Departments
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
