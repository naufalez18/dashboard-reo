import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Dashboard } from "~backend/dashboard/types";

interface DashboardFrameProps {
  dashboard: Dashboard;
  isActive: boolean;
}

export default function DashboardFrame({ dashboard, isActive }: DashboardFrameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  // Force reload when dashboard changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setKey(prev => prev + 1);
  }, [dashboard.id, dashboard.url]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 max-w-md text-center bg-white shadow-xl border-0">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Failed to Load Dashboard
          </h3>
          <p className="text-red-600 mb-4 font-medium">{dashboard.name}</p>
          <p className="text-sm text-slate-500">
            Please check the URL and try again
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-700 text-lg font-medium">Loading {dashboard.name}...</p>
          </div>
        </div>
      )}
      
      <iframe
        key={key}
        src={dashboard.url}
        className="w-full h-full border-0 block"
        title={dashboard.name}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        style={{
          opacity: isActive ? 1 : 0,
          transition: isActive ? 'opacity 0.5s ease-in-out' : 'none',
          display: 'block',
          margin: 0,
          padding: 0
        }}
        allowFullScreen
      />
    </div>
  );
}
