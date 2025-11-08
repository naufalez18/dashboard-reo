import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import type { Dashboard } from "~backend/dashboard/types";

interface PaginationParams {
  page?: number;
  limit?: number;
}

export function useDashboards(pagination?: PaginationParams) {
  const { getAuthenticatedBackend } = useAuth();
  const backend = getAuthenticatedBackend();

  return useQuery({
    queryKey: ["dashboards", pagination],
    queryFn: async () => {
      try {
        const result = await backend.dashboard.list();
        const dashboards = result.dashboards || [];
        
        if (pagination?.page !== undefined && pagination?.limit !== undefined) {
          const start = (pagination.page - 1) * pagination.limit;
          const end = start + pagination.limit;
          return {
            dashboards: dashboards.slice(start, end),
            total: dashboards.length,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(dashboards.length / pagination.limit),
          };
        }
        
        return {
          dashboards,
          total: dashboards.length,
        };
      } catch (err) {
        console.error("Failed to fetch dashboards:", err);
        throw err;
      }
    },
  });
}

export function useToggleDashboard() {
  const queryClient = useQueryClient();
  const { getAuthenticatedBackend } = useAuth();
  const backend = getAuthenticatedBackend();

  return useMutation({
    mutationFn: async (dashboard: Dashboard) => {
      return await backend.dashboard.update({
        id: dashboard.id,
        isActive: !dashboard.isActive,
      });
    },
    onMutate: async (dashboard: Dashboard) => {
      await queryClient.cancelQueries({ queryKey: ["dashboards"] });
      
      const previousData = queryClient.getQueriesData({ queryKey: ["dashboards"] });

      queryClient.setQueriesData<any>(
        { queryKey: ["dashboards"] },
        (old: any) => {
          if (!old) return old;

          const updatedDashboards = (old.dashboards || []).map((d: Dashboard) =>
            d.id === dashboard.id ? { ...d, isActive: !d.isActive } : d
          );

          return {
            ...old,
            dashboards: updatedDashboards,
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _dashboard, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      queryClient.invalidateQueries({ queryKey: ["active-dashboards"], exact: false });
    },
  });
}

export function useReorderDashboard() {
  const queryClient = useQueryClient();
  const { getAuthenticatedBackend } = useAuth();
  const backend = getAuthenticatedBackend();

  return useMutation({
    mutationFn: async ({ id, newSortOrder }: { id: number; newSortOrder: number }) => {
      return await backend.dashboard.reorder({ id, newSortOrder });
    },
    onMutate: async ({ id, newSortOrder }) => {
      await queryClient.cancelQueries({ queryKey: ["dashboards"] });

      const previousData = queryClient.getQueriesData({ queryKey: ["dashboards"] });

      queryClient.setQueriesData<any>(
        { queryKey: ["dashboards"] },
        (old: any) => {
          if (!old?.dashboards) return old;

          const dashboards = [...old.dashboards];
          const currentIndex = dashboards.findIndex((d: Dashboard) => d.id === id);
          
          if (currentIndex === -1) return old;

          const currentDashboard = dashboards[currentIndex];
          const oldSortOrder = currentDashboard.sortOrder;

          if (oldSortOrder < newSortOrder) {
            dashboards.forEach((d: Dashboard) => {
              if (d.sortOrder > oldSortOrder && d.sortOrder <= newSortOrder) {
                d.sortOrder -= 1;
              }
            });
          } else if (oldSortOrder > newSortOrder) {
            dashboards.forEach((d: Dashboard) => {
              if (d.sortOrder >= newSortOrder && d.sortOrder < oldSortOrder) {
                d.sortOrder += 1;
              }
            });
          }

          currentDashboard.sortOrder = newSortOrder;

          dashboards.sort((a, b) => a.sortOrder - b.sortOrder);

          return {
            ...old,
            dashboards,
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      queryClient.invalidateQueries({ queryKey: ["active-dashboards"], exact: false });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  const { getAuthenticatedBackend } = useAuth();
  const backend = getAuthenticatedBackend();

  return useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["active-dashboards"], exact: false });
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();
  const { getAuthenticatedBackend } = useAuth();
  const backend = getAuthenticatedBackend();

  return useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["active-dashboards"], exact: false });
    },
  });
}
