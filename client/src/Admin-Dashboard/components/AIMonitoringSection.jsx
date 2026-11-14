import { useState, useEffect } from "react";
import {
  Cpu,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Loader2,
  Activity,
  Layers,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AIMonitoringSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAIStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_URL}/api/admin/ai/stats`, {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
      }
    } catch (err) {
      console.warn("AI stats error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAIStats();
  }, []);

  const metrics = data?.metrics || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTimeMs: 820,
    activeModel: "gemini-3.8-flash",
  };

  const filteredLogs = (data?.recentLogs || []).filter((l) =>
    (l.request_type || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.model_used || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            AI Operations & Model Monitoring
          </h2>
          <p className="text-xs text-slate-500">
            Track exam generation requests, tutor chats, latency, failure rates, and Gemini API calls.
          </p>
        </div>

        <button
          onClick={fetchAIStats}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total AI Invocations
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Cpu size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalRequests}
          </p>
          <span className="text-[11px] text-slate-400">All features combined</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Success Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {metrics.totalRequests > 0
              ? `${Math.round((metrics.successfulRequests / metrics.totalRequests) * 100)}%`
              : "100%"}
          </p>
          <span className="text-[11px] text-slate-400">High reliability target</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Avg Response Time
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600">
            {metrics.avgResponseTimeMs} ms
          </p>
          <span className="text-[11px] text-slate-400">Fast inference speed</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Gemini Model
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Zap size={16} />
            </div>
          </div>
          <p className="mt-2 truncate text-sm font-black text-slate-900">
            {metrics.activeModel}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">● Google GenAI Active</span>
        </div>
      </div>

      {/* OPERATION LOGS TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent AI Operation Logs</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Filter operation logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Operation Type</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Latency</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 size={22} className="animate-spin mx-auto mb-2 text-purple-600" />
                    Loading AI operations log...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No logged operations match query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-bold text-slate-900 capitalize">
                      {(log.request_type || "exam_generation").replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                      {log.model_used || "gemini-3.8-flash"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {log.response_time_ms ? `${log.response_time_ms} ms` : "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          log.status === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString() : "Recent"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
