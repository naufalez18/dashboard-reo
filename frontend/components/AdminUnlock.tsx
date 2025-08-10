import React, { useState, useEffect, useRef } from "react";
import { Lock, Unlock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminUnlockProps {
  onUnlock: () => void;
  onCancel: () => void;
}

export default function AdminUnlock({ onUnlock, onCancel }: AdminUnlockProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Simple unlock code - in a real application, this would be more secure
  const UNLOCK_CODE = "admin123";

  useEffect(() => {
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code === UNLOCK_CODE) {
      onUnlock();
    } else {
      setError("Invalid unlock code");
      setCode("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="bg-white border-slate-200 w-full max-w-md mx-4 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-800 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-blue-600" />
              Admin Unlock Required
            </CardTitle>
            <Button
              onClick={onCancel}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unlock-code" className="text-slate-700">
                Enter unlock code to exit kiosk mode:
              </Label>
              <Input
                ref={inputRef}
                id="unlock-code"
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter unlock code"
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                autoComplete="off"
              />
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Unlock
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
            </div>

            <div className="text-xs text-slate-500 text-center bg-slate-50 p-2 rounded">
              <div className="mb-1">Default code: admin123</div>
              <div className="text-slate-400">Press <kbd className="bg-slate-200 px-1 rounded">Esc</kbd> to exit kiosk mode</div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
