import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Settings, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Dashboard } from "~backend/dashboard/types";
import DashboardFrame from "./DashboardFrame";
import RotationControls from "./RotationControls";

export default function DashboardRotation() {
  const [isRotating, setIsRotating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [rotationInterval, setRotationInterval] = useState<NodeJS.Timeout | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { data: dashboardsData, isLoading, error, refetch } = useQuery({
    queryKey: ["active-dashboards"],
    queryFn: async () => {
      try {
        return await backend.dashboard.listActive();
      } catch (err) {
        console.error("Failed to fetch active dashboards:", err);
        throw err;
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const dashboards = dashboardsData?.dashboards || [];

  const clearIntervals = useCallback(() => {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      setRotationInterval(null);
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
  }, [rotationInterval, countdownInterval]);

  const startRotation = useCallback(() => {
    if (dashboards.length === 0) {
      toast({
        title: "No Active Dashboards",
        description: "Please activate dashboards to start rotation.",
        variant: "destructive",
      });
      return;
    }

    setIsRotating(true);
    const currentDashboard = dashboards[currentIndex];
    const duration = currentDashboard?.displayDuration || 30;
    setTimeRemaining(duration);

    // Start countdown
    const countdown = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownInterval(countdown);

    // Start rotation
    const rotation = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % dashboards.length;
        setNextIndex((newIndex + 1) % dashboards.length);
        const nextDashboard = dashboards[newIndex];
        setTimeRemaining(nextDashboard?.displayDuration || 30);
        return newIndex;
      });
    }, duration * 1000);
    setRotationInterval(rotation);
  }, [dashboards, currentIndex, toast]);

  const stopRotation = useCallback(() => {
    setIsRotating(false);
    clearIntervals();
    setTimeRemaining(0);
  }, [clearIntervals]);

  const nextDashboard = useCallback(() => {
    if (dashboards.length === 0) return;
    
    const newIndex = (currentIndex + 1) % dashboards.length;
    setCurrentIndex(newIndex);
    setNextIndex((newIndex + 1) % dashboards.length);
    
    if (isRotating) {
      clearIntervals();
      const currentDashboard = dashboards[newIndex];
      const duration = currentDashboard?.displayDuration || 30;
      setTimeRemaining(duration);

      // Restart countdown
      const countdown = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setCountdownInterval(countdown);

      // Restart rotation
      const rotation = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIdx = (prevIndex + 1) % dashboards.length;
          setNextIndex((nextIdx + 1) % dashboards.length);
          const nextDashboard = dashboards[nextIdx];
          setTimeRemaining(nextDashboard?.displayDuration || 30);
          return nextIdx;
        });
      }, duration * 1000);
      setRotationInterval(rotation);
    }
  }, [dashboards, currentIndex, isRotating, clearIntervals]);

  const resetRotation = useCallback(() => {
    stopRotation();
    setCurrentIndex(0);
    setNextIndex(dashboards.length > 1 ? 1 : 0);
  }, [stopRotation, dashboards.length]);

  // Update next index when dashboards change
  useEffect(() => {
    if (dashboards.length > 0) {
      setNextIndex((currentIndex + 1) % dashboards.length);
    }
  }, [dashboards.length, currentIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearIntervals();
    };
  }, [clearIntervals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-white">Loading dashboards...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Card className="p-6 max-w-md bg-gray-900 border-gray-700">
          <div className="text-center">
            <div className="text-red-400 mb-4 text-lg">Failed to load dashboards</div>
            <Button onClick={() => refetch()} variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (dashboards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Card className="p-8 max-w-md text-center bg-gray-900 border-gray-700">
          <div className="text-gray-300 mb-4">No active dashboards configured</div>
          <p className="text-gray-500 text-sm mb-6">
            Configure and activate dashboards in the admin panel to start rotation
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <a href="/admin">
              <Settings className="w-4 h-4 mr-2" />
              Configure Dashboards
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  const currentDashboard = dashboards[currentIndex];
  const nextDashboardItem = dashboards[nextIndex];

  return (
    <div className="min-h-screen bg-black relative">
      {/* Main Dashboard Display */}
      <div className="absolute inset-0">
        <DashboardFrame
          dashboard={currentDashboard}
          isActive={true}
        />
      </div>

      {/* Preload Next Dashboard (Hidden) */}
      {nextDashboardItem && nextDashboardItem.id !== currentDashboard.id && (
        <div className="absolute inset-0 opacity-0 pointer-events-none">
          <DashboardFrame
            dashboard={nextDashboardItem}
            isActive={false}
          />
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-50">
        <RotationControls
          isRotating={isRotating}
          timeRemaining={timeRemaining}
          currentDashboard={currentDashboard}
          nextDashboard={nextDashboardItem}
          totalDashboards={dashboards.length}
          currentIndex={currentIndex}
          onStart={startRotation}
          onStop={stopRotation}
          onNext={nextDashboard}
          onReset={resetRotation}
        />
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-50">
        <Card className="bg-black/80 backdrop-blur-sm border-gray-700">
          <div className="p-3 flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <Badge variant={isRotating ? "default" : "secondary"}>
                {isRotating ? "ROTATING" : "PAUSED"}
              </Badge>
              <span className="text-sm">
                {currentIndex + 1} of {dashboards.length}
              </span>
              <span className="text-sm font-medium truncate max-w-xs">
                {currentDashboard?.name}
              </span>
            </div>
            
            {isRotating && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Next in:</span>
                <Badge variant="outline" className="text-white border-gray-500">
                  {timeRemaining}s
                </Badge>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
