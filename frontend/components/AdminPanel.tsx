import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Monitor, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Dashboard } from "~backend/dashboard/types";
import DashboardForm from "./DashboardForm";

export default function AdminPanel() {
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  if (showForm) {
    return (
      <DashboardForm
        dashboard={editingDashboard}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline">
              <a href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rotation
              </a>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
              <p className="text-gray-600">Manage your dashboard rotation</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Dashboard
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Monitor className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Dashboards</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboards.filter(d => d.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboards.filter(d => !d.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard List */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboards</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading dashboards...</div>
              </div>
            ) : dashboards.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No dashboards configured</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboards.map((dashboard, index) => (
                  <div
                    key={dashboard.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{dashboard.name}</h3>
                        <Badge variant={dashboard.isActive ? "default" : "secondary"}>
                          {dashboard.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {dashboard.displayDuration}s
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate max-w-md">
                        {dashboard.url}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleMoveUp(dashboard, index)}
                        disabled={index === 0}
                        size="sm"
                        variant="outline"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handleMoveDown(dashboard, index)}
                        disabled={index === dashboards.length - 1}
                        size="sm"
                        variant="outline"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handleToggleActive(dashboard)}
                        size="sm"
                        variant={dashboard.isActive ? "secondary" : "default"}
                      >
                        {dashboard.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      
                      <Button
                        onClick={() => handleEdit(dashboard)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handleDelete(dashboard.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
