import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter Code & New Password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [devCode, setDevCode] = useState(null);

  // Resend countdown
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Send 6-Digit Code to Gmail
  const handleRequestCode = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to send verification code.");
      }

      setSuccessMsg(json.message);
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code & Reset Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError("Please enter the complete 6-digit verification code sent to your Gmail.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
          newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to reset password.");
      }

      if (json.user) {
        setUser(json.user);
      }

      setSuccessMsg("Password successfully reset! Logging you in...");
      setTimeout(() => {
        navigate("/work");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[850px] bg-gradient-to-r from-[#fcfdfe] to-[#f2f7fe] flex flex-col md:flex-row border border-blue-500 rounded-3xl overflow-hidden shadow-xl">
        {/* LEFT SECTION - BRAND & INFO */}
        <div className="relative w-full md:w-5/12 text-center p-6 sm:p-8 flex flex-col justify-between">
          <a
            href="/"
            className="flex items-center justify-center md:justify-start gap-2 text-xl sm:text-2xl font-extrabold text-slate-900"
          >
            <span className="rounded-xl bg-blue-600 p-2 text-white">
              <GraduationCap size={26} />
            </span>
            Exam<span className="text-blue-600">Forge</span>
          </a>

          <div className="my-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-md">
              <KeyRound size={30} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Password Recovery
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              Recover access to your account securely via your verified Google Gmail address.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* RIGHT SECTION - FORMS */}
        <div className="w-full md:w-7/12 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900 p-6 sm:p-8 text-white shadow-2xl flex flex-col justify-center">
          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs font-semibold text-emerald-200">
              <CheckCircle2 size={17} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-200">
              <AlertCircle size={17} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Dev Mode Notification */}
          {devCode && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-950/40 px-3.5 py-2 text-xs text-amber-200">
              <span className="font-medium">Dev Test Code:</span>
              <span className="font-mono font-black text-amber-400 tracking-wider text-sm">
                {devCode}
              </span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: REQUEST CODE */
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  Enter your Gmail Address
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  We will send a 6-digit verification code to your email inbox.
                </p>
              </div>

              <div>
                <label htmlFor="recovery-email" className="mb-2 block text-xs font-semibold text-slate-300">
                  Gmail / Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-xs font-medium text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50 shadow-md cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Send 6-Digit Code to Gmail</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: VERIFY CODE & NEW PASSWORD */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Verify Code & Set New Password
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Check your Gmail ({email}) for the 6-digit code
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Change Email
                </button>
              </div>

              {/* 6-Digit Code Input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full text-center tracking-[0.3em] font-mono text-xl font-black rounded-xl border border-slate-700 bg-slate-950 py-2.5 text-indigo-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-11 pr-11 text-xs text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-11 pr-11 text-xs text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Didn't receive the code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleRequestCode}
                  className="font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-40 cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50 shadow-md cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Reset Password & Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
