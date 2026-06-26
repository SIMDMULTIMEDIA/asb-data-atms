"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/firebase/client";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(getFirebaseAuth() as any, email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#0A3D91] opacity-[0.03] blur-3xl" />
      <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#F5A623] opacity-[0.05] blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8 sm:p-12">
          
          <div className="mb-8">
            <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#0A3D91] transition-colors mb-6">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
            </Link>
            <h1 className="text-3xl font-bold text-[#0A3D91] mb-2">Reset Password</h1>
            <p className="text-slate-500">Enter your email and we'll send you a link to reset your password.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-6 bg-green-50 rounded-xl border border-green-100 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800 mb-1">Email Sent</h3>
              <p className="text-sm text-green-700">Check your inbox for instructions to reset your password.</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A3D91] focus:border-transparent outline-none transition-all text-slate-900"
                    placeholder="john@asbdata.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-[#0A3D91] hover:bg-[#083070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3D91] font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
