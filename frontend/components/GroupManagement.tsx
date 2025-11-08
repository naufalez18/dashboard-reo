import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import backend from "@/backend-client";
import type { Group } from "~backend/group/types";
import type { Dashboard } from "~backend/dashboard/types";

export function GroupManagement() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupDashboardIds, setGroupDashboardIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchDashboards();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await backend.group.list();
      setGroups(response.groups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load groups",
      });
    }
  };

  const fetchDashboards = async () => {
    try {
      const response = await backend.dashboard.list();
      setDashboards(response.dashboards);
    } catch (error) {
      console.error("Failed to fetch dashboards:", error);
    }
  };

  const selectGroup = async (group: Group) => {
    setSelectedGroup(group);
    setFormData({ name: group.name, description: group.description || "" });
    
    try {
      const groupDetails = await backend.group.get({ id: group.id });
      setGroupDashboardIds(groupDetails.dashboards.map(d => d.id));
    } catch (error) {
      console.error("Failed to fetch group details:", error);
      setGroupDashboardIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedGroup) {
        await backend.group.update({
          id: selectedGroup.id,
          ...formData,
          dashboardIds: groupDashboardIds,
          authorization: `Bearer ${token}`,
        });

        toast({
          title: "Success",
          description: "Group updated successfully",
        });
      } else {
        await backend.group.create({
          ...formData,
          dashboardIds: groupDashboardIds,
          authorization: `Bearer ${token}`,
        });

        toast({
          title: "Success",
          description: "Group created successfully",
        });
      }

      setFormData({ name: "", description: "" });
      setGroupDashboardIds([]);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      console.error("Failed to save group:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save group",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      await backend.group.deleteGroup({
        id,
        authorization: `Bearer ${token}`,
      });

      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
      fetchGroups();
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
        setFormData({ name: "", description: "" });
        setGroupDashboardIds([]);
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete group",
      });
    }
  };

  const toggleDashboard = (dashboardId: number) => {
    setGroupDashboardIds(prev =>
      prev.includes(dashboardId)
        ? prev.filter(id => id !== dashboardId)
        : [...prev, dashboardId]
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.map(group => (
            <div
              key={group.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => selectGroup(group)}
            >
              <div>
                <p className="font-medium">{group.name}</p>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  handleDelete(group.id);
                }}
              >
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedGroup ? "Edit Group" : "Create Group"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Dashboards</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {dashboards.map(dashboard => (
                  <label key={dashboard.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupDashboardIds.includes(dashboard.id)}
                      onChange={() => toggleDashboard(dashboard.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{dashboard.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : selectedGroup ? "Update" : "Create"}
              </Button>
              {selectedGroup && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedGroup(null);
                    setFormData({ name: "", description: "" });
                    setGroupDashboardIds([]);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
