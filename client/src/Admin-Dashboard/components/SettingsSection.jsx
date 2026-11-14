import { useState, useEffect } from "react";
import {
  Settings,
  KeyRound,
  Shield,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  User,
  Mail,
  Zap,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SettingsSection() {
  const { admin, updateCredentials } = useAdminAuth();

  // Account Settings Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingAccount, setUpdatingAccount] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState("");
  const [accountError, setAccountError] = useState("");

  // Platform Configuration Form
  const [platformSettings, setPlatformSettings] = useState({
    max_upload_size_mb: 100,
    max_lecture_size_mb: 500,
    allowed_document_formats: ["pdf", "docx"],
    allowed_lecture_formats: ["mp3", "wav", "m4a", "mp4"],
    ai_model: "gemini-3.8-flash",
    fallback_model: "gemini-3.8-flash-lite",
    platform_announcement: "",
    announcement_active: false,
    registration_enabled: true,
  });
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [platformSuccess, setPlatformSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_URL}/api/admin/settings`, {
          credentials: "include",
        });
        const json = await res.json();
        if (res.ok && json.data) {
          setPlatformSettings(json.data);
        }
      } catch (err) {
        console.warn(err);
      }
    }
    loadSettings();
  }, []);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountError("");
    setAccountSuccess("");

    if (!currentPassword) {
      setAccountError("Please enter your current password to authorize changes.");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setAccountError("New password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setAccountError("New password and confirm password do not match.");
        return;
      }
    }

    setUpdatingAccount(true);
    try {
      await updateCredentials({
        currentPassword,
        newUsername: newUsername.trim() || undefined,
        newPassword: newPassword || undefined,
      });

      setAccountSuccess("Admin credentials updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNewUsername("");
    } catch (err) {
      setAccountError(err.message || "Failed to update admin credentials.");
    } finally {
      setUpdatingAccount(false);
    }
  };

  const handlePlatformSubmit = async (e) => {
    e.preventDefault();
    setSavingPlatform(true);
    setPlatformSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(platformSettings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save settings.");

      setPlatformSuccess("Platform settings updated successfully!");
      setTimeout(() => setPlatformSuccess(""), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPlatform(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
          System & Account Settings
        </h2>
        <p className="text-xs text-slate-500">
          Manage administrator security credentials, upload limits, and platform configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* CARD 1: ADMIN ACCOUNT CREDENTIALS */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xs">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Administrator Account Security
              </h3>
              <p className="text-xs text-slate-500">
                Current Admin: <span className="font-bold text-slate-800">{admin?.username}</span>
              </p>
            </div>
          </div>

          {accountSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{accountSuccess}</span>
            </div>
          )}

          {accountError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{accountError}</span>
            </div>
          )}

          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Change Admin Username (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder={`Current: ${admin?.username}`}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                New Password (Optional, Min 8 chars)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {newPassword && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                Current Password (Required to Save)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingAccount}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {updatingAccount ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              <span>Save Admin Credentials</span>
            </button>
          </form>
        </div>

        {/* CARD 2: PLATFORM CONFIGURATION */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xs">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Platform Rules & AI Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure upload limits, global announcements, and AI models.
              </p>
            </div>
          </div>

          {platformSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{platformSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePlatformSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Max Document Size (MB)
                </label>
                <input
                  type="number"
                  value={platformSettings.max_upload_size_mb || 100}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, max_upload_size_mb: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Max Lecture Size (MB)
                </label>
                <input
                  type="number"
                  value={platformSettings.max_lecture_size_mb || 500}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, max_lecture_size_mb: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                AI Generation Model
              </label>
              <select
                value={platformSettings.ai_model || "gemini-3.8-flash"}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, ai_model: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500"
              >
                <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (Recommended)</option>
                <option value="gemini-3.8-flash-lite">Google Gemini 3.8 Flash Lite (High Speed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Platform Banner Announcement
              </label>
              <input
                type="text"
                placeholder="e.g. Midterm exam templates updated for semester 2!"
                value={platformSettings.platform_announcement || ""}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, platform_announcement: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="announcementActive"
                checked={!!platformSettings.announcement_active}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, announcement_active: e.target.checked })
                }
                className="rounded accent-indigo-600"
              />
              <label htmlFor="announcementActive" className="text-xs font-semibold text-slate-700">
                Display announcement banner to all students
              </label>
            </div>

            <button
              type="submit"
              disabled={savingPlatform}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {savingPlatform ? <Loader2 size={16} className="animate-spin" /> : <Sliders size={16} />}
              <span>Save Platform Configuration</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
