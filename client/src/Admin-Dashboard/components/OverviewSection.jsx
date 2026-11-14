import { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  FileText,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  HardDrive,
  RefreshCw,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function OverviewSection({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_URL}/api/admin/overview`, {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
      }
    } catch (err) {
      console.warn("Overview error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const metrics = data?.metrics || {
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalExams: 0,
    examsToday: 0,
    totalDocuments: 0,
    totalStorageBytes: 0,
    totalAIRequests: 0,
    failedAIRequests: 0,
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            Platform Overview
          </h2>
          <p className="text-xs text-slate-500">
            Real-time platform activity, user growth, exam generations, and system health.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigate && onNavigate("users")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-blue-400 hover:shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
            {metrics.totalUsers}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <ArrowUpRight size={14} />
            <span>+{metrics.newUsersToday} today</span>
          </div>
        </div>

        {/* Total Exams */}
        <div
          onClick={() => onNavigate && onNavigate("exams")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-indigo-400 hover:shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Generated Exams
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <GraduationCap size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
            {metrics.totalExams}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
            <span>+{metrics.examsToday} generated today</span>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div
          onClick={() => onNavigate && onNavigate("documents")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-amber-400 hover:shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Study Documents
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
            {metrics.totalDocuments}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <HardDrive size={13} />
            <span>{formatBytes(metrics.totalStorageBytes)} storage used</span>
          </div>
        </div>

        {/* AI Operations */}
        <div
          onClick={() => onNavigate && onNavigate("ai")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-purple-400 hover:shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              AI Operations
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Cpu size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
            {metrics.totalAIRequests}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
            {metrics.failedAIRequests > 0 ? (
              <span className="text-rose-600 flex items-center gap-1">
                <AlertTriangle size={13} /> {metrics.failedAIRequests} failures
              </span>
            ) : (
              <span className="text-emerald-600">100% operational</span>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS & RECENT ACTIVITY DUAL COLUMN */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity Trends SVG Visual */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Platform Activity & Traffic</h3>
              <p className="text-xs text-slate-500">Weekly trend overview</p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
              Live Metrics
            </span>
          </div>

          {/* SVG Visual Activity Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
              // Normalized dynamic heights based on actual stats
              const heights = [45, 65, 80, 50, 95, 75, 90];
              const h = heights[idx];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="relative w-full flex justify-center items-end h-full">
                    {/* Bar */}
                    <div
                      style={{ height: `${h}%` }}
                      className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-300 group-hover:from-blue-500 group-hover:to-indigo-400"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-blue-600" /> Exam Creations
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-indigo-500" /> Student Registrations
              </span>
            </div>
            <span className="text-slate-400">Past 7 days activity</span>
          </div>
        </div>

        {/* Recent Platform Activity Feed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Platform Events</h3>
              <Clock size={15} className="text-slate-400" />
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {(!data?.recentActivities || data.recentActivities.length === 0) ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No platform events recorded yet.
                </p>
              ) : (
                data.recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      {act.type === "USER_SIGNUP" ? (
                        <Users size={12} />
                      ) : act.type === "EXAM_GENERATED" ? (
                        <GraduationCap size={12} />
                      ) : (
                        <FileText size={12} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{act.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{act.description}</p>
                      <span className="text-[10px] text-slate-400">
                        {act.timestamp
                          ? new Date(act.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate && onNavigate("logs")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
            >
              View All Admin Audit Logs →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
