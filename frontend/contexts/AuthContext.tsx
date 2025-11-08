import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import backend from "~backend/client";
import type { User } from "~backend/auth/types";
import type { CreateDashboardRequest, UpdateDashboardRequest } from "~backend/dashboard/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getAuthenticatedBackend: () => any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app start
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Verify token is still valid
        backend.auth.verifyToken({ token: storedToken })
          .then((response) => {
            setUser(response.user);
          })
          .catch((error) => {
            console.error("Token verification failed:", error);
            // Token is invalid, clear storage
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setToken(null);
            setUser(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (error) {
        console.error("Error parsing stored auth data:", error);
        // Invalid stored data, clear it
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log("Attempting login with:", { username, passwordLength: password.length });
      
      const response = await backend.auth.login({ 
        username: username.trim(), 
        password: password.trim() 
      });
      
      console.log("Login response received:", { user: response.user });
      
      setToken(response.token);
      setUser(response.user);
      
      // Store in localStorage
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.user));
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await backend.auth.logout({ token });
        console.log("Backend logout successful");
      } catch (error) {
        console.error("Backend logout failed:", error);
      }
    }
    
    queryClient.clear();
    
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    
    window.location.reload();
  };

  const getAuthenticatedBackend = () => {
    if (!token) {
      return backend;
    }

    return {
      ...backend,
      auth: {
        ...backend.auth,
        listUsers: () => backend.auth.listUsers({ authorization: `Bearer ${token}` }),
        createUser: (data: any) => backend.auth.createUser({ ...data, authorization: `Bearer ${token}` }),
        updateUser: (data: any) => backend.auth.updateUser({ ...data, authorization: `Bearer ${token}` }),
        deleteUser: (data: { id: number }) => backend.auth.deleteUser({ ...data, authorization: `Bearer ${token}` }),
      },
      dashboard: {
        list: () => backend.dashboard.list({ authorization: `Bearer ${token}` }),
        listActive: () => backend.dashboard.listActive({ authorization: `Bearer ${token}` }),
        listByUser: () => backend.dashboard.listByUser({ authorization: `Bearer ${token}` }),
        create: (data: CreateDashboardRequest) => 
          backend.dashboard.create({ ...data, authorization: `Bearer ${token}` }),
        update: (data: UpdateDashboardRequest) => 
          backend.dashboard.update({ ...data, authorization: `Bearer ${token}` }),
        deleteDashboard: (data: { id: number }) => 
          backend.dashboard.deleteDashboard({ ...data, authorization: `Bearer ${token}` }),
      },
      group: {
        ...backend.group,
        list: () => backend.group.list(),
        get: (data: { id: number }) => backend.group.get(data),
        create: (data: any) => backend.group.create({ ...data, authorization: `Bearer ${token}` }),
        update: (data: any) => backend.group.update({ ...data, authorization: `Bearer ${token}` }),
        deleteGroup: (data: { id: number }) => backend.group.deleteGroup({ ...data, authorization: `Bearer ${token}` }),
      },
    };
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    getAuthenticatedBackend,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
