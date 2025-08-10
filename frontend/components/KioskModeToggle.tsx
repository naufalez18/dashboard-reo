import React from "react";
import { Monitor, MonitorSpeaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface KioskModeToggleProps {
  isKioskMode: boolean;
  onToggle: () => void;
}

export default function KioskModeToggle({ isKioskMode, onToggle }: KioskModeToggleProps) {
  return (
    <Card className="bg-white/95 backdrop-blur-sm border-slate-200 p-2 shadow-lg">
      <Button
        onClick={onToggle}
        size="sm"
        variant={isKioskMode ? "default" : "outline"}
        className={
          isKioskMode
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }
        title={isKioskMode ? "Exit Kiosk Mode" : "Enter Kiosk Mode (K)"}
      >
        {isKioskMode ? (
          <>
            <MonitorSpeaker className="w-4 h-4 mr-2" />
            Kiosk Mode
          </>
        ) : (
          <>
            <Monitor className="w-4 h-4 mr-2" />
            Kiosk Mode
          </>
        )}
      </Button>
    </Card>
  );
}
