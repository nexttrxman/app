import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("inflow_token");
    if (!token) {
      setUser(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      localStorage.removeItem("inflow_token");
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("inflow_ref", ref.toUpperCase());
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("inflow_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, referralCode) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      referral_code: referralCode || null,
    });
    localStorage.setItem("inflow_token", data.token);
    localStorage.removeItem("inflow_ref");
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("inflow_token");
    setUser(false);
  };

  const setBalance = (balance) => {
    setUser((u) => (u ? { ...u, balance } : u));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
