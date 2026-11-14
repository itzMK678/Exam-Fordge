import { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  const checkAdminAuth = async () => {
    try {
      // 1. Check setup status first
      const setupRes = await fetch(`${API_URL}/api/admin/setup-status`);
      const setupData = await setupRes.json();

      if (setupRes.ok && setupData.isSetup === false) {
        setIsSetupRequired(true);
        setAdmin(null);
        setLoading(false);
        return;
      }

      setIsSetupRequired(false);

      // 2. Check if admin session cookie is active
      const meRes = await fetch(`${API_URL}/api/admin/me`, {
        method: "GET",
        credentials: "include",
      });

      if (meRes.ok) {
        const meData = await meRes.json();
        setAdmin(meData.admin);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      console.warn("[AdminAuthContext] Check error:", err.message);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Admin login failed.");
    }

    setAdmin(data.admin);
    setIsSetupRequired(false);
    return data.admin;
  };

  const setupInitial = async (username, email, password) => {
    const res = await fetch(`${API_URL}/api/admin/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Initial admin setup failed.");
    }

    setAdmin(data.admin);
    setIsSetupRequired(false);
    return data.admin;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("[Admin Logout] Error:", e.message);
    } finally {
      setAdmin(null);
    }
  };

  const updateCredentials = async ({ currentPassword, newUsername, newPassword, newEmail }) => {
    const res = await fetch(`${API_URL}/api/admin/credentials`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newUsername, newPassword, newEmail }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to update admin credentials.");
    }

    setAdmin(data.admin);
    return data.admin;
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        isSetupRequired,
        login,
        setupInitial,
        logout,
        updateCredentials,
        checkAdminAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }
  return context;
}
