import React, { useState } from "react";
import { Play, Pause, SkipForward, RotateCcw, Settings, Eye, EyeOff } from "lucide-react";
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
}: RotationControlsProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        size="sm"
        variant="outline"
        className="bg-black/80 backdrop-blur-sm border-gray-600 text-white hover:bg-gray-800"
      >
        <Eye className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="bg-black/90 backdrop-blur-sm border-gray-700 p-4 min-w-80">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Dashboard Rotation</h3>
          <Button
            onClick={() => setIsVisible(false)}
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Dashboard Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Current:</span>
            <Badge variant="outline" className="text-white border-gray-500">
              {currentIndex + 1} / {totalDashboards}
            </Badge>
          </div>
          <div className="text-white font-medium truncate">
            {currentDashboard?.name}
          </div>
          {nextDashboard && (
            <div className="text-gray-400 text-sm">
              Next: {nextDashboard.name}
            </div>
          )}
        </div>

        {/* Timer */}
        {isRotating && (
          <div className="text-center">
            <div className="text-2xl font-mono text-white mb-1">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-gray-400 text-xs">Time remaining</div>
          </div>
        )}

        {/* Controls */}
        <div className="flex space-x-2">
          <Button
            onClick={isRotating ? onStop : onStart}
            size="sm"
            className={isRotating ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
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
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Next
          </Button>

          <Button
            onClick={onReset}
            size="sm"
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Admin Link */}
        <div className="pt-2 border-t border-gray-700">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="w-full text-gray-400 hover:text-white"
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
