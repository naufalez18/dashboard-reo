import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import type { Dashboard, CreateDashboardRequest, UpdateDashboardRequest } from "~backend/dashboard/types";

interface DashboardFormProps {
  dashboard?: Dashboard | null;
  onClose: () => void;
}

export default function DashboardForm({ dashboard, onClose }: DashboardFormProps) {
  const [formData, setFormData] = useState({
    name: dashboard?.name || "",
    url: dashboard?.url || "",
    displayDuration: dashboard?.displayDuration || 30,
    sortOrder: dashboard?.sortOrder || 0,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getAuthenticatedBackend } = useAuth();
  const backend = getAuthenticatedBackend();
  const isEditing = !!dashboard;

  const createMutation = useMutation({
    mutationFn: async (data: CreateDashboardRequest) => {
      try {
        return await backend.dashboard.create(data);
      } catch (err) {
        console.error("Failed to create dashboard:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      toast({
        title: "Success",
        description: "Dashboard created successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Create error:", error);
      toast({
        title: "Error",
        description: "Failed to create dashboard",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateDashboardRequest) => {
      try {
        return await backend.dashboard.update(data);
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
      onClose();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and URL are required",
        variant: "destructive",
      });
      return;
    }

    if (isEditing && dashboard) {
      updateMutation.mutate({
        id: dashboard.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button onClick={onClose} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isEditing ? "Edit Dashboard" : "Add Dashboard"}
            </h1>
            <p className="text-slate-600">
              {isEditing ? "Update dashboard settings" : "Configure a new dashboard for rotation"}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Dashboard Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">Dashboard Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Sales Dashboard"
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-slate-700">Dashboard URL</Label>
                <Textarea
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleChange("url", e.target.value)}
                  placeholder="https://app.powerbi.com/view?r=..."
                  rows={3}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-slate-600">
                  Enter the full URL of your Power BI dashboard or any other iframe-compatible URL
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayDuration" className="text-slate-700">Display Duration (seconds)</Label>
                  <Input
                    id="displayDuration"
                    type="number"
                    min="10"
                    max="3600"
                    value={formData.displayDuration}
                    onChange={(e) => handleChange("displayDuration", parseInt(e.target.value) || 30)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-sm text-slate-600">
                    How long to display this dashboard (10-3600 seconds)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder" className="text-slate-700">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => handleChange("sortOrder", parseInt(e.target.value) || 0)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-sm text-slate-600">
                    Lower numbers appear first in rotation
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button type="button" variant="outline" onClick={onClose} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : isEditing ? "Update Dashboard" : "Create Dashboard"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-6 bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Tips for Power BI Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-600">
              <p className="font-medium mb-2 text-slate-700">For Power BI dashboards:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use the "Publish to web" feature to get a public URL</li>
                <li>Or use the embed URL from your Power BI workspace</li>
                <li>Ensure the dashboard is set to auto-refresh if needed</li>
                <li>Test the URL in an incognito window to verify accessibility</li>
              </ul>
            </div>
            
            <div className="text-sm text-slate-600">
              <p className="font-medium mb-2 text-slate-700">For other dashboards:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Any URL that can be embedded in an iframe will work</li>
                <li>Ensure the target site allows iframe embedding</li>
                <li>Consider authentication requirements for private dashboards</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
