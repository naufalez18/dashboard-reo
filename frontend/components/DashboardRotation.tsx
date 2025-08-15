import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Settings, RotateCcw, LogOut, User, Shield, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
// import AdminUnlock from "./AdminUnlock"; // ❌ dihapus
import type { Dashboard } from "~backend/dashboard/types";
import DashboardFrame from "./DashboardFrame";
import RotationControls from "./RotationControls";
import KioskModeToggle from "./KioskModeToggle";

/** === Draggable Badge (untuk indikator minimal) === */
function DraggableBadge({
  current,
  total,
  seconds,
  storageKey = "rotation-badge-pos",
}: {
  current: number;
  total: number;
  seconds: number;
  storageKey?: string;
}) {
  type Pos = { x: number; y: number };
  const pillRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ dx: number; dy: number } | null>(null);
  const [pos, setPos] = useState<Pos>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : { x: 24, y: 24 };
    } catch {
      return { x: 24, y: 24 };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(pos));
    } catch {}
  }, [pos, storageKey]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  useEffect(() => {
    const el = pillRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      dragStart.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
      el.classList.add("cursor-grabbing");
    };
    const onMove = (e: PointerEvent) => {
      if (!dragStart.current) return;
      const root = document.documentElement;
      const vw = root.clientWidth;
      const vh = root.clientHeight;
      const rect = el.getBoundingClientRect();
      const x = clamp(e.clientX - dragStart.current.dx, 0, vw - rect.width);
      const y = clamp(e.clientY - dragStart.current.dy, 0, vh - rect.height);
      setPos({ x, y });
    };
    const onUp = (e: PointerEvent) => {
      if (!dragStart.current) return;
      dragStart.current = null;
      el.releasePointerCapture(e.pointerId);
      el.classList.remove("cursor-grabbing");
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pos.x, pos.y]);

  return (
    <div
      ref={pillRef}
      role="button"
      aria-label="status badge draggable"
      tabIndex={0}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      className="fixed z-[1000] select-none cursor-grab"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center space-x-3 shadow-lg border border-slate-200">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <span className="text-slate-700 text-sm font-semibold">
          {current}/{total}
        </span>
        <span className="text-slate-500 text-sm">{seconds}s</span>
      </div>
    </div>
  );
}

export default function DashboardRotation() {
  const [isRotating, setIsRotating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [rotationInterval, setRotationInterval] = useState<NodeJS.Timeout | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();
  const { user, logout, getAuthenticatedBackend } = useAuth();
  const api = getAuthenticatedBackend();

  const { data: dashboardsData, isLoading, error, refetch } = useQuery({
    queryKey: ["active-dashboards"],
    queryFn: async () => {
      try {
        const svc: any = (api as any).dashboard;
        if (svc && typeof svc.listActive === "function") {
          return await svc.listActive();
        }
        const all = await api.dashboard.list();
        return { dashboards: (all?.dashboards ?? []).filter((d: Dashboard) => !!d.isActive) };
      } catch (err: any) {
        if (err && typeof err === "object" && err.status === 401) {
          try { logout(); } catch {}
        }
        console.error("Failed to fetch active dashboards:", err);
        throw err;
      }
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const dashboards: Dashboard[] = dashboardsData?.dashboards || [];

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
    const duration = Math.max(1, Math.round(currentDashboard?.displayDuration || 30));
    setTimeRemaining(duration);

    const countdown = setInterval(() => setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
    setCountdownInterval(countdown);

    const rotation = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % dashboards.length;
        setNextIndex((newIndex + 1) % dashboards.length);
        const nextDashboard = dashboards[newIndex];
        const nextDuration = Math.max(1, Math.round(nextDashboard?.displayDuration || 30));
        setTimeRemaining(nextDuration);
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
      const duration = Math.max(1, Math.round(currentDashboard?.displayDuration || 30));
      setTimeRemaining(duration);

      const countdown = setInterval(() => setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
      setCountdownInterval(countdown);

      const rotation = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIdx = (prevIndex + 1) % dashboards.length;
          setNextIndex((nextIdx + 1) % dashboards.length);
          const nextDashboard = dashboards[nextIdx];
          const nextDuration = Math.max(1, Math.round(nextDashboard?.displayDuration || 30));
          setTimeRemaining(nextDuration);
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
      const duration = Math.max(1, Math.round(currentDashboard?.displayDuration || 30));
      setTimeRemaining(duration);

      const countdown = setInterval(() => setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
      setCountdownInterval(countdown);

      const rotation = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIdx = (prevIndex + 1) % dashboards.length;
          setNextIndex((nextIdx + 1) % dashboards.length);
          const nextDashboard = dashboards[nextIdx];
          const nextDuration = Math.max(1, Math.round(nextDashboard?.displayDuration || 30));
          setTimeRemaining(nextDuration);
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
    setShowControls(prev => (!isKioskMode ? false : true));
  }, [isKioskMode]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        toast({ title: "Fullscreen Mode", description: "Press F11 or Escape to exit fullscreen" });
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      toast({ title: "Fullscreen Error", description: "Unable to toggle fullscreen mode", variant: "destructive" });
    }
  }, [toast]);

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out" });
  };

  // Fullscreen change monitor
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyR', 'KeyK', 'F11', 'Escape'].includes(event.code)) {
        event.preventDefault();
      }
      switch (event.code) {
        case 'Space':
          isRotating ? stopRotation() : startRotation();
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
          if (!isKioskMode) toggleKioskMode();
          break;
        case 'F11':
          toggleFullscreen();
          break;
        case 'Escape':
          // ❗ langsung keluar dari kiosk mode, tanpa AdminUnlock
          if (isKioskMode) {
            setIsKioskMode(false);
            setShowControls(true);
            toast({ title: "Kiosk Mode Disabled", description: "Controls are now available" });
          } else if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRotating, startRotation, stopRotation, nextDashboard, previousDashboard, resetRotation, toggleKioskMode, toggleFullscreen, isKioskMode, toast]);

  // Update next index when dashboards change
  useEffect(() => {
    if (dashboards.length > 0) {
      setNextIndex((currentIndex + 1) % dashboards.length);
    }
  }, [dashboards.length, currentIndex]);

  // Auto-hide controls when rotating (not in kiosk)
  useEffect(() => {
    if (isRotating && !isKioskMode) {
      const timer = setTimeout(() => setShowControls(false), 10000);
      return () => clearTimeout(timer);
    } else if (!isKioskMode) {
      setShowControls(true);
    }
  }, [isRotating, showControls, isKioskMode]);

  // Show controls on mouse move (not in kiosk)
  useEffect(() => {
    const handleMouseMove = () => { if (!isKioskMode) setShowControls(true); };
    if (isRotating && !isKioskMode) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isRotating, isKioskMode]);

  // Cleanup
  useEffect(() => clearIntervals, [clearIntervals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-slate-700 font-medium">Loading dashboards...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-6 max-w-md bg-white shadow-xl border-0">
          <div className="text-center">
            <div className="text-red-600 mb-4 text-lg font-semibold">Failed to load dashboards</div>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 max-w-md text-center bg-white shadow-xl border-0">
          <div className="text-slate-700 mb-4 text-lg font-semibold">No active dashboards configured</div>
          <p className="text-slate-500 text-sm mb-6">
            Configure and activate dashboards in the admin panel to start rotation
          </p>
          {user?.role === "admin" ? (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/admin">
                <Settings className="w-4 h-4 mr-2" />
                Configure Dashboards
              </a>
            </Button>
          ) : (
            <div className="text-slate-500 text-sm">
              Contact your administrator to configure dashboards
            </div>
          )}
        </Card>
      </div>
    );
  }

  const currentDashboard = dashboards[currentIndex];
  const nextDashboardItem = dashboards[nextIndex];

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      {/* Iframe penuh */}
      <div className="absolute inset-0">
        <DashboardFrame
          dashboard={currentDashboard}
          isActive={true}
          isKioskMode={isKioskMode}  // tetap kirim untuk tombol Interact/Control hanya saat kiosk
        />
      </div>

      {/* Preload next (hidden) */}
      {nextDashboardItem && nextDashboardItem.id !== currentDashboard.id && (
        <div className="absolute inset-0 opacity-0 pointer-events-none">
          <DashboardFrame
            dashboard={nextDashboardItem}
            isActive={false}
            isKioskMode={isKioskMode}
          />
        </div>
      )}

      {/* User Info - Top Left */}
      {!isKioskMode && (
        <div className="absolute top-6 left-6 z-50">
          <div className="flex items-center space-x-3">
            <KioskModeToggle isKioskMode={isKioskMode} onToggle={toggleKioskMode} />
            <Card className="bg-white/95 backdrop-blur-sm border-slate-200 p-3 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {user?.role === "admin" ? <Shield className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-slate-800">{user?.username}</div>
                  <div className="text-slate-500 capitalize">{user?.role}</div>
                </div>
                <Badge variant={user?.role === "admin" ? "destructive" : "secondary"} className="text-xs">
                  {user?.role}
                </Badge>
                <Button onClick={handleLogout} size="sm" variant="ghost" className="text-slate-400 hover:text-slate-600 p-1" title="Logout">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && !isKioskMode && (
        <div className="absolute top-6 right-6 z-50 transition-opacity duration-300">
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
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            userRole={user?.role}
          />
        </div>
      )}

      {/* Minimal Status Indicator → DRAGGABLE */}
      {isRotating && (!showControls || isKioskMode) && (
        <DraggableBadge current={currentIndex + 1} total={dashboards.length} seconds={timeRemaining} />
      )}

      {/* Keyboard Shortcuts Hint */}
      {!isKioskMode && !isRotating && showControls && (
        <div className="absolute bottom-6 left-6 z-50">
          <Card className="bg-white/95 backdrop-blur-sm border-slate-200 p-4 shadow-lg">
            <div className="text-xs text-slate-600 space-y-2">
              <div className="font-medium text-slate-700 mb-2">Keyboard Shortcuts</div>
              <div><kbd className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono text-xs">Space</kbd> Play/Pause</div>
              <div><kbd className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono text-xs">←→</kbd> Navigate</div>
              <div><kbd className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono text-xs">R</kbd> Reset</div>
              <div><kbd className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono text-xs">K</kbd> Kiosk Mode</div>
              <div><kbd className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono text-xs">F</kbd> Interact / Control dashboard</div>
              <div><kbd className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono text-xs">F11</kbd> Fullscreen</div>
              <div><kbd className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono text-xs">Esc</kbd> Exit Kiosk/Fullscreen</div>
            </div>
          </Card>
        </div>
      )}

      {/* Click anywhere to show controls when hidden (but not in kiosk mode) */}
      {!showControls && !isKioskMode && (
        <div className="absolute inset-0 z-40 cursor-pointer" onClick={() => setShowControls(true)} />
      )}
    </div>
  );
}
