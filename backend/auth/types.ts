export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  role: "admin" | "viewer";
  groupId?: number;
  groupName?: string;
}

export interface AuthData {
  userID: string;
  username: string;
  role: "admin" | "viewer";
  groupId?: number;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: "admin" | "viewer";
  groupId?: number;
}

export interface UpdateUserRequest {
  id: number;
  username?: string;
  password?: string;
  role?: "admin" | "viewer";
  groupId?: number;
}
