import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem("examforge_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserState(data.user);
          try {
            localStorage.setItem("examforge_user", JSON.stringify(data.user));
          } catch (e) {
            console.warn("Failed to persist user:", e);
          }
        }
      } else {
        setUserState(null);
        try {
          localStorage.removeItem("examforge_user");
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Auth verification network error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const setUser = (userData) => {
    setUserState(userData);
    try {
      if (userData) {
        localStorage.setItem("examforge_user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("examforge_user");
      }
    } catch (e) {
      console.warn("Failed to persist user in localStorage:", e);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      setUserState(null);
      try {
        localStorage.removeItem("examforge_user");
      } catch (e) {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
