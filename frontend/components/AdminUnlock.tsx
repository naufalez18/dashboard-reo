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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="bg-gray-900 border-gray-700 w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Admin Unlock Required
            </CardTitle>
            <Button
              onClick={onCancel}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unlock-code" className="text-gray-300">
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
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                autoComplete="off"
              />
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
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
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Default code: admin123
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
