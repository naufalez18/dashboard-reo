import React, { useState } from "react";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Monitor, ArrowLeft, Eye, EyeOff, LogOut, User, Shield, Users, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "./Pagination";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import type { Dashboard } from "~backend/dashboard/types";
import DashboardForm from "./DashboardForm";
import { UserManagement } from "./UserManagement";
import { GroupManagement } from "./GroupManagement";
import { useDashboards, useToggleDashboard, useReorderDashboard, useDeleteDashboard } from "../hooks/useDashboards";

type TabView = "dashboards" | "users" | "groups";

const ITEMS_PER_PAGE = 10;

export default function AdminPanel() {
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>("dashboards");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const { data: dashboardsData, isLoading } = useDashboards({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  const toggleMutation = useToggleDashboard();
  const reorderMutation = useReorderDashboard();
  const deleteMutation = useDeleteDashboard();

  const dashboards = dashboardsData?.dashboards || [];
  const totalPages = dashboardsData?.totalPages || 1;
  const totalDashboards = dashboardsData?.total || 0;

  const handleEdit = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this dashboard?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({
          title: "Success",
          description: "Dashboard deleted successfully",
        });
      } catch (error) {
        console.error("Delete error:", error);
        toast({
          title: "Error",
          description: "Failed to delete dashboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleActive = async (dashboard: Dashboard) => {
    try {
      await toggleMutation.mutateAsync(dashboard);
      toast({
        title: "Success",
        description: `Dashboard ${dashboard.isActive ? "deactivated" : "activated"} successfully`,
      });
    } catch (error) {
      console.error("Toggle error:", error);
      toast({
        title: "Error",
        description: "Failed to update dashboard",
        variant: "destructive",
      });
    }
  };

  const handleMoveUp = async (dashboard: Dashboard, index: number) => {
    if (index === 0 && currentPage === 1) return;

    const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
    const newSortOrder = globalIndex - 1;

    try {
      await reorderMutation.mutateAsync({
        id: dashboard.id,
        newSortOrder,
      });
    } catch (error) {
      console.error("Reorder error:", error);
      toast({
        title: "Error",
        description: "Failed to reorder dashboard",
        variant: "destructive",
      });
    }
  };

  const handleMoveDown = async (dashboard: Dashboard, index: number) => {
    const isLastOnPage = index === dashboards.length - 1;
    const isLastOverall = currentPage === totalPages && isLastOnPage;
    
    if (isLastOverall) return;

    const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
    const newSortOrder = globalIndex + 1;

    try {
      await reorderMutation.mutateAsync({
        id: dashboard.id,
        newSortOrder,
      });
    } catch (error) {
      console.error("Reorder error:", error);
      toast({
        title: "Error",
        description: "Failed to reorder dashboard",
        variant: "destructive",
      });
    }
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

  const activeDashboards = dashboards.filter((d: Dashboard) => d.isActive);
  const inactiveDashboards = dashboards.filter((d: Dashboard) => !d.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
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
            
            {activeTab === "dashboards" && (
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Dashboard
              </Button>
            )}
            
            <Button onClick={handleLogout} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="flex space-x-2 mb-6">
          <Button
            onClick={() => setActiveTab("dashboards")}
            variant={activeTab === "dashboards" ? "default" : "outline"}
            className={activeTab === "dashboards" ? "bg-blue-600" : "border-slate-300"}
          >
            <Monitor className="w-4 h-4 mr-2" />
            Dashboards
          </Button>
          <Button
            onClick={() => setActiveTab("users")}
            variant={activeTab === "users" ? "default" : "outline"}
            className={activeTab === "users" ? "bg-blue-600" : "border-slate-300"}
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </Button>
          <Button
            onClick={() => setActiveTab("groups")}
            variant={activeTab === "groups" ? "default" : "outline"}
            className={activeTab === "groups" ? "bg-blue-600" : "border-slate-300"}
          >
            <Layers className="w-4 h-4 mr-2" />
            Groups
          </Button>
        </div>

        {activeTab === "users" && <UserManagement />}
        {activeTab === "groups" && <GroupManagement />}
        
        {activeTab === "dashboards" && (
          <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <Monitor className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Dashboards</p>
                  <p className="text-2xl font-bold text-slate-900">{totalDashboards}</p>
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
                      ? Math.round(activeDashboards.reduce((sum: number, d: Dashboard) => sum + d.displayDuration, 0) / activeDashboards.length)
                      : 0}s
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {totalDashboards > 10 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Monitor className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Sample Power BI Dashboards Loaded</p>
                  <p className="text-xs text-blue-600">
                    {totalDashboards} sample dashboards have been added for demonstration. 
                    Replace the URLs with your actual Power BI dashboard links.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-900">
              <span>Dashboards</span>
              {totalDashboards > 0 && (
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  {activeDashboards.length} active of {totalDashboards} total
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
            ) : totalDashboards === 0 ? (
              <div className="text-center py-8">
                <Monitor className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No dashboards configured</p>
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {dashboards.map((dashboard: Dashboard, index: number) => (
                    <div
                      key={dashboard.id}
                      className={`flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all ${
                        !dashboard.isActive ? 'opacity-60' : ''
                      } ${
                        toggleMutation.isPending || reorderMutation.isPending 
                          ? 'transition-all duration-200' 
                          : ''
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
                          disabled={index === 0 && currentPage === 1}
                          size="sm"
                          variant="outline"
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          onClick={() => handleMoveDown(dashboard, index)}
                          disabled={currentPage === totalPages && index === dashboards.length - 1}
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

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}
