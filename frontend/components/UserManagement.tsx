import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "./ui/use-toast";
import { Badge } from "./ui/badge";
import backend from "~backend/client";
import type { User } from "~backend/auth/types";
import type { Group } from "~backend/group/types";

export function UserManagement() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "viewer" as "admin" | "viewer",
    groupId: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await backend.auth.listUsers({ authorization: `Bearer ${token}` });
      setUsers(response.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      });
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await backend.group.list();
      setGroups(response.groups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
      groupId: user.groupId,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedUser) {
        const updateData: any = {
          id: selectedUser.id,
          username: formData.username,
          role: formData.role,
          groupId: formData.groupId || null,
          authorization: `Bearer ${token}`,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        await backend.auth.updateUser(updateData);

        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        await backend.auth.createUser({
          ...formData,
          groupId: formData.groupId || undefined,
          authorization: `Bearer ${token}`,
        });

        toast({
          title: "Success",
          description: "User created successfully",
        });
      }

      setFormData({ username: "", password: "", role: "viewer", groupId: undefined });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to save user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save user",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await backend.auth.deleteUser({ id, authorization: `Bearer ${token}` });

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
      if (selectedUser?.id === id) {
        setSelectedUser(null);
        setFormData({ username: "", password: "", role: "viewer", groupId: undefined });
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => selectUser(user)}
            >
              <div className="flex-1">
                <p className="font-medium">{user.username}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                  {user.groupName && (
                    <Badge variant="outline">{user.groupName}</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  handleDelete(user.id);
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
          <CardTitle>{selectedUser ? "Edit User" : "Create User"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">
                Password {selectedUser && "(leave blank to keep current)"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required={!selectedUser}
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as "admin" | "viewer" })}
                className="w-full p-2 border rounded-md bg-background"
                required
              >
                <option value="viewer">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <Label htmlFor="group">Group</Label>
              <select
                id="group"
                value={formData.groupId || ""}
                onChange={e => setFormData({ ...formData, groupId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">No Group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : selectedUser ? "Update" : "Create"}
              </Button>
              {selectedUser && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(null);
                    setFormData({ username: "", password: "", role: "viewer", groupId: undefined });
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
