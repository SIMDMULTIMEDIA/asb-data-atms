"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData } = useAuth();

  return (
    <AuthGuard requiredRole="admin">
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Header */}
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-end px-8 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{userData?.fullName || user?.email}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{userData?.role?.replace('_', ' ')}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <span className="text-slate-600 font-medium text-sm">
                  {userData?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
