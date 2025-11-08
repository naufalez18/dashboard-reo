export interface Group {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  dashboardIds?: number[];
}

export interface UpdateGroupRequest {
  id: number;
  name?: string;
  description?: string;
  dashboardIds?: number[];
}

export interface GroupWithDashboards extends Group {
  dashboards: GroupDashboard[];
}

export interface GroupDashboard {
  id: number;
  name: string;
  url: string;
}
