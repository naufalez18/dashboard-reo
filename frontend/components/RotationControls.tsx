import React, { useState } from "react";
import { Play, Pause, SkipForward, RotateCcw, Settings, Eye, EyeOff, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Dashboard } from "~backend/dashboard/types";

interface RotationControlsProps {
  isRotating: boolean;
  timeRemaining: number;
  currentDashboard: Dashboard;
  nextDashboard: Dashboard;
  totalDashboards: number;
  currentIndex: number;
  onStart: () => void;
  onStop: () => void;
  onNext: () => void;
  onReset: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function RotationControls({
  isRotating,
  timeRemaining,
  currentDashboard,
  nextDashboard,
  totalDashboards,
  currentIndex,
  onStart,
  onStop,
  onNext,
  onReset,
  isFullscreen,
  onToggleFullscreen,
}: RotationControlsProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        size="sm"
        variant="outline"
        className="bg-white/95 backdrop-blur-sm border-slate-200 text-slate-700 hover:bg-slate-50 shadow-lg"
      >
        <Eye className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-slate-200 p-4 min-w-80 shadow-xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-slate-800 font-semibold">Dashboard Rotation</h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onToggleFullscreen}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-slate-600"
              title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-slate-600"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Current Dashboard Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 text-sm font-medium">Current:</span>
            <Badge variant="outline" className="text-slate-700 border-slate-300 bg-slate-50">
              {currentIndex + 1} / {totalDashboards}
            </Badge>
          </div>
          <div className="text-slate-800 font-semibold truncate">
            {currentDashboard?.name}
          </div>
          {nextDashboard && (
            <div className="text-slate-500 text-sm">
              Next: {nextDashboard.name}
            </div>
          )}
        </div>

        {/* Timer */}
        {isRotating && (
          <div className="text-center bg-slate-50 rounded-lg p-3">
            <div className="text-2xl font-mono text-slate-800 mb-1">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-slate-500 text-xs font-medium">Time remaining</div>
          </div>
        )}

        {/* Controls */}
        <div className="flex space-x-2">
          <Button
            onClick={isRotating ? onStop : onStart}
            size="sm"
            className={isRotating ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
          >
            {isRotating ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>

          <Button
            onClick={onNext}
            size="sm"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Next
          </Button>

          <Button
            onClick={onReset}
            size="sm"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Admin Link */}
        <div className="pt-3 border-t border-slate-200">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="w-full text-slate-600 hover:text-slate-800 hover:bg-slate-50"
          >
            <a href="/admin">
              <Settings className="w-4 h-4 mr-2" />
              Admin Panel
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
