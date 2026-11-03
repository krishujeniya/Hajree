import React, { createContext, useContext, useEffect, useState } from "react";
import { Role, User } from "../types";
import { api, getStoredToken } from "../api/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: "light" | "dark";
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    name: string;
    email?: string;
    password: string;
    role: Role;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("hajree_theme") as "light" | "dark") || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("hajree_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const refreshUser = async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const u = await api.me();
          setUser(u);
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (u: string, p: string) => {
    const session = await api.login(u, p);
    setUser(session.user);
  };

  const register = async (data: {
    username: string;
    name: string;
    email?: string;
    password: string;
    role: Role;
  }) => {
    const session = await api.register(data);
    setUser(session.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        login,
        register,
        logout,
        refreshUser,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
