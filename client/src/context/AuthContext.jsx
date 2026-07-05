import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem("sfph_token");
    if (!token) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data.user);
      setRole(data.role);
    } catch {
      localStorage.removeItem("sfph_token");
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (data) => {
    localStorage.setItem("sfph_token", data.token);
    await loadSession();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem("sfph_token");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, refresh: loadSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
