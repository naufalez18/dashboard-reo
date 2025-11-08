import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, LogIn, Monitor, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // Redirect if already logged in
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(username.trim(), password.trim());
      toast({
        title: "Login Successful",
        description: "Welcome to REO Dashboard Rotation System",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Extract error message from the error object
      let errorMessage = "Invalid username or password";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">REO Dashboard Monitoring</h1>
          <p className="text-blue-200">Electronic Channel Operations Group</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-slate-800">Sign In</CardTitle>
            <p className="text-slate-600 text-sm">Enter your credentials to continue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0 h-auto bg-transparent hover:bg-transparent text-slate-400 hover:text-slate-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
						{/*<div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 text-center mb-4 font-medium">Demo Accounts</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">Administrator</div>
                      <div className="text-xs text-slate-500">naufalez / Nopal1206!</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive" className="text-xs">Admin</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleDemoLogin("naufalez", "Nopal1206!")}
                      className="text-xs border-slate-300 text-slate-600 hover:bg-slate-100"
                      disabled={isLoading}
                    >
                      Use
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">Viewer</div>
                      <div className="text-xs text-slate-500">reodept / reo123</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Viewer</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleDemoLogin("reodept", "reo123")}
                      className="text-xs border-slate-300 text-slate-600 hover:bg-slate-100"
                      disabled={isLoading}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              </div>
            </div>  */}

            {/* Features */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Monitor className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xs font-medium text-slate-700">Dashboard Rotation</div>
                  <div className="text-xs text-slate-500">Automated cycling</div>
                </div>
                <div className="p-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xs font-medium text-slate-700">Role-Based Access</div>
                  <div className="text-xs text-slate-500">Secure permissions</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-blue-200 text-sm">
            © 2025 REO Dashboard Monitoring. Made With ❤️ by <b>Naufal</b>.
          </p>
        </div>
      </div>
    </div>
  );
}
