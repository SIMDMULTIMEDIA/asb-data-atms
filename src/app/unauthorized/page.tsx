import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-8">
          You do not have the required permissions to access this page. Please contact your administrator if you believe this is a mistake.
        </p>
        <Link 
          href="/dashboard"
          className="inline-flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0A3D91] hover:bg-[#083070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3D91]"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
