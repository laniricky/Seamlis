"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("seamlis-token");
      if (token) {
        try {
          const fetchedUser = await fetchApi<User>("/auth/me");
          setUser(fetchedUser);
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.removeItem("seamlis-token");
          localStorage.removeItem("seamlis-refresh");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (tokens: AuthTokens, user: User) => {
    localStorage.setItem("seamlis-token", tokens.accessToken);
    localStorage.setItem("seamlis-refresh", tokens.refreshToken);
    setUser(user);
  };

  const logout = async () => {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch {
      // Token is invalid or expired
      localStorage.removeItem('seamlis-token');
      localStorage.removeItem("seamlis-refresh");
      setUser(null);
    } finally {
      localStorage.removeItem("seamlis-token");
      localStorage.removeItem("seamlis-refresh");
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const fetchedUser = await fetchApi<User>("/auth/me");
      setUser(fetchedUser);
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
