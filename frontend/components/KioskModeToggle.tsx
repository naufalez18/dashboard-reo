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
    <Card className="bg-black/80 backdrop-blur-sm border-gray-700 p-2">
      <Button
        onClick={onToggle}
        size="sm"
        variant={isKioskMode ? "default" : "outline"}
        className={
          isKioskMode
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "border-gray-600 text-white hover:bg-gray-800"
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
