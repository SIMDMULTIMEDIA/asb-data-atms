"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { LayoutDashboard, Users, TrendingUp, DollarSign, AlertCircle, Lightbulb } from "lucide-react";

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/admin/executive", label: "Command Center", icon: LayoutDashboard },
    { href: "/admin/executive/workforce", label: "Workforce Analytics", icon: Users },
    { href: "/admin/executive/crm", label: "CRM Analytics", icon: TrendingUp },
    { href: "/admin/executive/payroll", label: "Payroll Analytics", icon: DollarSign },
    { href: "/admin/executive/alerts", label: "Risk Alerts", icon: AlertCircle },
    { href: "/admin/executive/insights", label: "AI Insights", icon: Lightbulb },
  ];

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "ceo", "director"]}>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        {/* Executive Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-black text-white tracking-tight">EXECUTIVE BI</h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Command Center</p>
          </div>
          <nav className="flex-1 py-6 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-slate-800 text-white border-r-4 border-blue-500" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-6 border-t border-slate-800">
            <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-white transition-colors">
              &larr; Back to Admin
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
