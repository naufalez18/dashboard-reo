export interface Dashboard {
  id: number;
  name: string;
  url: string;
  displayDuration: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDashboardRequest {
  name: string;
  url: string;
  displayDuration?: number;
  sortOrder?: number;
}

export interface UpdateDashboardRequest {
  id: number;
  name?: string;
  url?: string;
  displayDuration?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface DashboardsResponse {
  dashboards: Dashboard[];
}

export interface RotationStatus {
  isActive: boolean;
  currentDashboardId: number | null;
  totalDashboards: number;
  nextRotationIn: number;
}
