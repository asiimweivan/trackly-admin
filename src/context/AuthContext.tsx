import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  token: string | null;
  role: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("admin_role"));

  const login = (t: string, r: string) => {
    localStorage.setItem("admin_token", t);
    localStorage.setItem("admin_role", r);
    setToken(t);
    setRole(r);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isAuthenticated: !!token, isSuperAdmin: role === "SUPER_ADMIN" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
