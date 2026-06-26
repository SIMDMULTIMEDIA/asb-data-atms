"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children, requiredRole, allowedRoles }: { children: React.ReactNode, requiredRole?: string, allowedRoles?: string[] }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (!userData && pathname !== '/onboarding') {
        // User is authenticated but has no firestore document -> Needs onboarding/setup
        router.push('/onboarding');
      } else if (requiredRole && userData?.role !== requiredRole && userData?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else if (allowedRoles && !allowedRoles.includes(userData?.role || '')) {
        router.push('/unauthorized');
      }
    }
  }, [user, userData, loading, router, pathname, requiredRole, allowedRoles]);

  if (loading || !user || (!userData && pathname !== '/onboarding')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#0A3D91]" />
      </div>
    );
  }

  if (requiredRole && userData?.role !== requiredRole && userData?.role !== 'super_admin') {
    return null; // Will redirect in useEffect
  }
  
  if (allowedRoles && !allowedRoles.includes(userData?.role || '')) {
    return null;
  }

  return <>{children}</>;
}
