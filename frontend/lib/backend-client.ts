import backend from "~backend/client";
import type { CreateDashboardRequest, UpdateDashboardRequest, Dashboard } from "~backend/dashboard/types";

export function createAuthenticatedBackend(token: string | null) {
  if (!token) {
    return backend;
  }

  // Create authenticated wrapper for dashboard service
  const authenticatedDashboard = {
    create: async (data: CreateDashboardRequest): Promise<Dashboard> => {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Failed to create dashboard');
      }

      return response.json();
    },

    update: async (data: UpdateDashboardRequest): Promise<Dashboard> => {
      const response = await fetch(`/api/dashboards/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Failed to update dashboard');
      }

      return response.json();
    },

    deleteDashboard: async (data: { id: number }): Promise<void> => {
      const response = await fetch(`/api/dashboards/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Failed to delete dashboard');
      }
    },

    list: backend.dashboard.list,
    listActive: backend.dashboard.listActive,
  };

  return {
    ...backend,
    dashboard: authenticatedDashboard,
  };
}