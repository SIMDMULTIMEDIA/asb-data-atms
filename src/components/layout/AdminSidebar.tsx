"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Banknote, 
  BarChart3, 
  Settings, 
  CheckSquare,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', href: '/admin/attendance', icon: Calendar },
  { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
  { name: 'Payroll', href: '/admin/payroll', icon: Banknote },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Performance', href: '/admin/performance', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen">
      <div className="flex items-center justify-center h-20 border-b border-slate-100 px-6">
        <div className="flex items-center space-x-3 w-full">
          <div className="h-10 w-10 bg-[#0A3D91] rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-bold tracking-tight text-sm">ASB</span>
          </div>
          <span className="font-bold text-slate-800 text-lg whitespace-nowrap overflow-hidden text-ellipsis">ATMS Admin</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-[#0A3D91] shadow-sm border border-blue-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon 
                  className={`flex-shrink-0 mr-3 h-5 w-5 ${isActive ? 'text-[#0A3D91]' : 'text-slate-400'}`} 
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={signOut}
          className="flex w-full items-center px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="flex-shrink-0 mr-3 h-5 w-5 text-slate-400 group-hover:text-red-500" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
