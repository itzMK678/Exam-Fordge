import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "../../Context/AuthContext";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(e.target);
    const email = data.get("email")?.toString().trim().toLowerCase();
    const password = data.get("password")?.toString();

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Receives and stores httpOnly cookie
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to log in.");
      if (result.user) {
        setUser(result.user);
      }
      // Redirect to /work upon successful login
      navigate("/work");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    
  <main className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-[900px] bg-gradient-to-r from-[#fcfdfe] to-[#f2f7fe] flex flex-col md:flex-row border border-blue-500 rounded-2xl">

      {/* LEFT SECTION */}
      <div className="relative w-full md:w-1/2 text-center p-6 sm:p-8 pt-14 md:pt-8">

        <a
          href="/"
          className="absolute -top-3 left-3 sm:-top-8.5 sm:left-5 flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-slate-900"
        >
          <span className="rounded-xl bg-blue-600 p-2 text-white">
            <GraduationCap size={30} />
          </span>
          Exam<span className="text-blue-600">Forge</span>
        </a>

        <div className="mx-auto mb-4 mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#155dfc] text-white">
          <LogIn size={28} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#155dfc]">
          Welcome Back
        </h1>

        <p className="mt-2 text-sm sm:text-base text-slate-700">
          Sign in to continue to your account and access your past exams,
          quizzes, and other resources.
        </p>

        <p className="mt-7 text-center text-sm text-black">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Create account
          </Link>
        </p>
      </div>

      {/* RIGHT SECTION - LOGIN FORM */}
      <div className="w-full md:w-1/2 rounded-b-2xl md:rounded-r-2xl md:rounded-r-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-slate-200">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={19} />

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="password" className="text-sm text-slate-200">
                Password
              </label>

              <Link to="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={19} />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-12 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" className="accent-indigo-500" />
            Remember me
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
           
          </button>

        </form>
      </div>
    </div>
  </main>

  );
}
