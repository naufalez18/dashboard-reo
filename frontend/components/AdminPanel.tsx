import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Monitor, ArrowLeft, Eye, EyeOff, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import type { Dashboard } from "~backend/dashboard/types";
import DashboardForm from "./DashboardForm";

export default function AdminPanel() {
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout, getAuthenticatedBackend } = useAuth();

  const backend = getAuthenticatedBackend();

  const { data: dashboardsData, isLoading } = useQuery({
    queryKey: ["dashboards"],
    queryFn: async () => {
      try {
        return await backend.dashboard.list();
      } catch (err) {
        console.error("Failed to fetch dashboards:", err);
        throw err;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        await backend.dashboard.deleteDashboard({ id });
      } catch (err) {
        console.error("Failed to delete dashboard:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      queryClient.invalidateQueries({ queryKey: ["active-dashboards"] });
      toast({
        title: "Success",
        description: "Dashboard deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (dashboard: Partial<Dashboard> & { id: number }) => {
      try {
        return await backend.dashboard.update(dashboard);
      } catch (err) {
        console.error("Failed to update dashboard:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      queryClient.invalidateQueries({ queryKey: ["active-dashboards"] });
      toast({
        title: "Success",
        description: "Dashboard updated successfully",
      });
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update dashboard",
        variant: "destructive",
      });
    },
  });

  const dashboards = dashboardsData?.dashboards || [];

  const handleEdit = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this dashboard?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = async (dashboard: Dashboard) => {
    updateMutation.mutate({
      id: dashboard.id,
      isActive: !dashboard.isActive,
    });
  };

  const handleMoveUp = async (dashboard: Dashboard, index: number) => {
    if (index === 0) return;
    
    const prevDashboard = dashboards[index - 1];
    updateMutation.mutate({
      id: dashboard.id,
      sortOrder: prevDashboard.sortOrder,
    });
    updateMutation.mutate({
      id: prevDashboard.id,
      sortOrder: dashboard.sortOrder,
    });
  };

  const handleMoveDown = async (dashboard: Dashboard, index: number) => {
    if (index === dashboards.length - 1) return;
    
    const nextDashboard = dashboards[index + 1];
    updateMutation.mutate({
      id: dashboard.id,
      sortOrder: nextDashboard.sortOrder,
    });
    updateMutation.mutate({
      id: nextDashboard.id,
      sortOrder: dashboard.sortOrder,
    });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDashboard(null);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  if (showForm) {
    return (
      <DashboardForm
        dashboard={editingDashboard}
        onClose={handleFormClose}
      />
    );
  }

  const activeDashboards = dashboards.filter(d => d.isActive);
  const inactiveDashboards = dashboards.filter(d => !d.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <a href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rotation
              </a>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard Admin</h1>
              <p className="text-slate-600">Manage your dashboard rotation</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 border border-slate-200 shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {user?.role === "admin" ? (
                  <Shield className="w-4 h-4 text-blue-600" />
                ) : (
                  <User className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="text-sm">
                <div className="font-medium text-slate-800">{user?.username}</div>
                <div className="text-slate-500 capitalize">{user?.role}</div>
              </div>
              <Badge variant={user?.role === "admin" ? "destructive" : "secondary"} className="text-xs">
                {user?.role}
              </Badge>
            </div>
            
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Dashboard
            </Button>
            
            <Button onClick={handleLogout} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <Monitor className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Dashboards</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                  <Eye className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-slate-900">{activeDashboards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mr-4">
                  <EyeOff className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Inactive</p>
                  <p className="text-2xl font-bold text-slate-900">{inactiveDashboards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mr-4">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {activeDashboards.length > 0 
                      ? Math.round(activeDashboards.reduce((sum, d) => sum + d.displayDuration, 0) / activeDashboards.length)
                      : 0}s
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Data Notice */}
        {dashboards.length > 10 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Monitor className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Sample Power BI Dashboards Loaded</p>
                  <p className="text-xs text-blue-600">
                    {dashboards.length} sample dashboards have been added for demonstration. 
                    Replace the URLs with your actual Power BI dashboard links.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard List */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-900">
              <span>Dashboards</span>
              {dashboards.length > 0 && (
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  {activeDashboards.length} active of {dashboards.length} total
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-slate-600">Loading dashboards...</div>
              </div>
            ) : dashboards.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No dashboards configured</p>
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboards.map((dashboard, index) => (
                  <div
                    key={dashboard.id}
                    className={`flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors ${
                      !dashboard.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-900 truncate">{dashboard.name}</h3>
                        <Badge variant={dashboard.isActive ? "default" : "secondary"} className={
                          dashboard.isActive 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }>
                          {dashboard.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="border-slate-300 text-slate-700">
                          {dashboard.displayDuration}s
                        </Badge>
                        <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                          #{dashboard.sortOrder}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 truncate max-w-2xl">
                        {dashboard.url}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => handleMoveUp(dashboard, index)}
                        disabled={index === 0}
                        size="sm"
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handleMoveDown(dashboard, index)}
                        disabled={index === dashboards.length - 1}
                        size="sm"
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handleToggleActive(dashboard)}
                        size="sm"
                        variant={dashboard.isActive ? "secondary" : "default"}
                        className={dashboard.isActive 
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }
                        title={dashboard.isActive ? "Deactivate" : "Activate"}
                      >
                        {dashboard.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        onClick={() => handleEdit(dashboard)}
                        size="sm"
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handleDelete(dashboard.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
