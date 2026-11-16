import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AuthCallback() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    async function processOAuthCallback() {
      try {
        // 1. Extract hash fragment or search params
        const hash = window.location.hash.substring(1);
        const search = window.location.search.substring(1);

        const params = new URLSearchParams(hash || search);
        const code = params.get("code");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const errorDescription = params.get("error_description") || params.get("error");

        if (errorDescription) {
          throw new Error(errorDescription.replace(/\+/g, " "));
        }

        let res;

        // 1. Direct Google Authorization Code flow
        if (code) {
          const callbackUri = window.location.origin + window.location.pathname;
          res = await fetch(`${API_URL}/api/auth/google-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ code, redirect_uri: callbackUri }),
          });
        } else if (accessToken) {
          // 2. Supabase OAuth Access Token flow
          res = await fetch(`${API_URL}/api/auth/google-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
          });
        } else {
          // Check existing session
          const checkRes = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            if (checkJson.user) {
              setUser(checkJson.user);
              navigate("/work");
              return;
            }
          }
          throw new Error("No authentication code or token received from Google.");
        }

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to complete Google Sign-In.");
        }

        if (json.user) {
          setUser(json.user);
        }

        // Clean up URL hash and redirect
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/work");
      } catch (err) {
        console.error("OAuth Callback error:", err);
        setError(err.message || "Authentication failed.");
      }
    }

    processOAuthCallback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white text-center">
      <div className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-white">
        <span className="rounded-xl bg-blue-600 p-2 text-white">
          <GraduationCap size={28} />
        </span>
        Exam<span className="text-blue-500">Forge</span>
      </div>

      {error ? (
        <div className="max-w-md rounded-3xl border border-rose-500/30 bg-rose-950/40 p-6 backdrop-blur-md">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-white">Sign-In Failed</h2>
          <p className="mt-2 text-xs text-rose-200">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <Sparkles className="absolute text-blue-400" size={18} />
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Completing Google Authentication...
          </h2>
          <p className="text-xs text-slate-400">
            Setting up your secure session. You will be redirected in a moment.
          </p>
        </div>
      )}
    </div>
  );
}
