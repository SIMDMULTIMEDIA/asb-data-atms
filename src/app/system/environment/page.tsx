"use client";

import React from "react";
import { ConfigurationHealth } from "@/components/ConfigurationHealth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Server, Code, Activity, Clock } from "lucide-react";

export default function EnvironmentValidationPage() {
  const { userData } = useAuth();
  
  // Basic rendering info since we're in the browser
  const buildEnv = process.env.NODE_ENV || "unknown";
  const currentTime = new Date().toLocaleString();

  if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
          Not authorized to view system environment.
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Environment Validation</h1>
            <p className="text-slate-600">Diagnostics and system configuration.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Configuration Health */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-500" />
              <span>Firebase Configuration</span>
            </h2>
            <ConfigurationHealth />
          </div>

          {/* System Environment */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <span>Runtime Status</span>
            </h2>
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Code className="w-4 h-4" />
                  <span className="text-sm font-medium">Build Environment</span>
                </div>
                <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-800">{buildEnv}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Server className="w-4 h-4" />
                  <span className="text-sm font-medium">Runtime Mode</span>
                </div>
                <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-800">Client (Browser)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Current Time</span>
                </div>
                <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-800">{currentTime}</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
