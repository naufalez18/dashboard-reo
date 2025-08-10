import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Settings, RotateCcw, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Dashboard } from "~backend/dashboard/types";
import DashboardFrame from "./DashboardFrame";
import RotationControls from "./RotationControls";
import KioskModeToggle from "./KioskModeToggle";
import AdminUnlock from "./AdminUnlock";

export default function DashboardRotation() {
  const [isRotating, setIsRotating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [rotationInterval, setRotationInterval] = useState<NodeJS.Timeout | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
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

  const previousDashboard = useCallback(() => {
    if (dashboards.length === 0) return;
    
    const newIndex = currentIndex === 0 ? dashboards.length - 1 : currentIndex - 1;
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

  const toggleKioskMode = useCallback(() => {
    setIsKioskMode(prev => !prev);
    if (!isKioskMode) {
      setShowControls(false);
    } else {
      setShowControls(true);
    }
  }, [isKioskMode]);

  const handleAdminUnlock = useCallback(() => {
    setIsKioskMode(false);
    setShowControls(true);
    setShowAdminUnlock(false);
    toast({
      title: "Kiosk Mode Disabled",
      description: "Admin controls are now available",
    });
  }, [toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for our shortcuts
      if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyR', 'KeyK'].includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'Space':
          if (isRotating) {
            stopRotation();
          } else {
            startRotation();
          }
          break;
        case 'ArrowRight':
          nextDashboard();
          break;
        case 'ArrowLeft':
          previousDashboard();
          break;
        case 'KeyR':
          resetRotation();
          break;
        case 'KeyK':
          if (!isKioskMode) {
            toggleKioskMode();
          }
          break;
        case 'Escape':
          if (isKioskMode) {
            setShowAdminUnlock(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRotating, startRotation, stopRotation, nextDashboard, previousDashboard, resetRotation, toggleKioskMode, isKioskMode]);

  // Update next index when dashboards change
  useEffect(() => {
    if (dashboards.length > 0) {
      setNextIndex((currentIndex + 1) % dashboards.length);
    }
  }, [dashboards.length, currentIndex]);

  // Auto-hide controls after 10 seconds of inactivity when rotating (but not in kiosk mode)
  useEffect(() => {
    if (isRotating && !isKioskMode) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 10000);
      return () => clearTimeout(timer);
    } else if (!isKioskMode) {
      setShowControls(true);
    }
  }, [isRotating, showControls, isKioskMode]);

  // Show controls on mouse movement (but not in kiosk mode)
  useEffect(() => {
    const handleMouseMove = () => {
      if (!isKioskMode) {
        setShowControls(true);
      }
    };

    if (isRotating && !isKioskMode) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isRotating, isKioskMode]);

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
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Main Dashboard Display - Full screen without any obstruction */}
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

      {/* Kiosk Mode Toggle - Only show when not in kiosk mode */}
      {!isKioskMode && (
        <div className="absolute top-4 left-4 z-50">
          <KioskModeToggle
            isKioskMode={isKioskMode}
            onToggle={toggleKioskMode}
          />
        </div>
      )}

      {/* Control Panel - Only show when controls are visible and not in kiosk mode */}
      {showControls && !isKioskMode && (
        <div className="absolute top-4 right-4 z-50 transition-opacity duration-300">
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
      )}

      {/* Minimal Status Indicator - Only show when rotating and controls are hidden or in kiosk mode */}
      {isRotating && (!showControls || isKioskMode) && (
        <div className="absolute top-4 left-4 z-50">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">
              {currentIndex + 1}/{dashboards.length}
            </span>
            <span className="text-gray-300 text-sm">
              {timeRemaining}s
            </span>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint - Only show when not in kiosk mode and not rotating */}
      {!isKioskMode && !isRotating && showControls && (
        <div className="absolute bottom-4 left-4 z-50">
          <Card className="bg-black/80 backdrop-blur-sm border-gray-700 p-3">
            <div className="text-xs text-gray-300 space-y-1">
              <div><kbd className="bg-gray-700 px-1 rounded text-white">Space</kbd> Play/Pause</div>
              <div><kbd className="bg-gray-700 px-1 rounded text-white">←→</kbd> Navigate</div>
              <div><kbd className="bg-gray-700 px-1 rounded text-white">R</kbd> Reset</div>
              <div><kbd className="bg-gray-700 px-1 rounded text-white">K</kbd> Kiosk Mode</div>
            </div>
          </Card>
        </div>
      )}

      {/* Admin Unlock Modal */}
      {showAdminUnlock && (
        <AdminUnlock
          onUnlock={handleAdminUnlock}
          onCancel={() => setShowAdminUnlock(false)}
        />
      )}

      {/* Click anywhere to show controls when hidden (but not in kiosk mode) */}
      {!showControls && !isKioskMode && (
        <div 
          className="absolute inset-0 z-40 cursor-pointer"
          onClick={() => setShowControls(true)}
        />
      )}
    </div>
  );
}
