"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface ConfigStatus {
  key: string;
  exists: boolean;
}

export function ConfigurationHealth() {
  const [config, setConfig] = useState<ConfigStatus[]>([]);
  const [isHealthy, setIsHealthy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // In Next.js, process.env is only available if explicitly referenced.
    // However, NEXT_PUBLIC_ variables are inlined at build time.
    const keys = [
      { key: "NEXT_PUBLIC_FIREBASE_API_KEY", val: process.env.NEXT_PUBLIC_FIREBASE_API_KEY },
      { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", val: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN },
      { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", val: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
      { key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", val: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET },
      { key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", val: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID },
      { key: "NEXT_PUBLIC_FIREBASE_APP_ID", val: process.env.NEXT_PUBLIC_FIREBASE_APP_ID }
    ];

    const status = keys.map(({ key, val }) => ({
      key,
      exists: !!val
    }));

    setConfig(status);
    setIsHealthy(status.every(s => s.exists));
  }, []);

  if (!mounted) return null;

  if (isHealthy) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded-md border border-green-100">
        <CheckCircle2 className="w-4 h-4" />
        <span className="font-medium">Firebase Config Loaded</span>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-100 rounded-lg p-4 w-full">
      <div className="flex items-center space-x-2 text-red-700 mb-3">
        <XCircle className="w-5 h-5" />
        <h3 className="font-semibold text-sm">Firebase Configuration Missing</h3>
      </div>
      <div className="space-y-1.5">
        {config.map(({ key, exists }) => (
          <div key={key} className="flex items-center space-x-2 text-xs font-mono">
            {exists ? (
              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
            <span className={exists ? "text-slate-600 truncate" : "text-red-600 font-medium truncate"} title={key}>
              {key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
