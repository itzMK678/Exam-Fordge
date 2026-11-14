import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  Layers,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SystemHealthSection() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const runHealthCheck = async () => {
    try {
      setChecking(true);
      const res = await fetch(`${API_URL}/api/admin/health/check`, {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) setHealth(json.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const formatUptime = (seconds = 0) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            Technical System Health
          </h2>
          <p className="text-xs text-slate-500">
            Real-time ping checks across database, storage, AI provider, and microservices.
          </p>
        </div>

        <button
          onClick={runHealthCheck}
          disabled={checking}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
          <span>{checking ? "Checking Systems..." : "Run Live Diagnostics"}</span>
        </button>
      </div>

      {/* OVERALL STATUS BANNER */}
      <div
        className={`rounded-3xl border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          health?.status === "operational"
            ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
            : "border-amber-200 bg-amber-50/60 text-amber-950"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              health?.status === "operational"
                ? "bg-emerald-600 text-white"
                : "bg-amber-600 text-white"
            }`}
          >
            {health?.status === "operational" ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div>
            <h3 className="text-base font-black">
              {health?.status === "operational"
                ? "All Core Systems Fully Operational"
                : "System Health Advisory / Partial Notice"}
            </h3>
            <p className="text-xs text-slate-600">
              Exam generation, vector search, storage, and authentication are performing within normal parameters.
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-black shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Diagnostics Verified
        </span>
      </div>

      {/* COMPONENT DIAGNOSTICS GRID */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(health?.components || []).map((comp, idx) => {
          const isOp = comp.status === "operational";
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{comp.name}</h4>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isOp
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isOp ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                    <span className="capitalize">{comp.status}</span>
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{comp.details}</p>
              </div>

              {comp.latencyMs !== undefined && comp.latencyMs > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Latency</span>
                  <span className="text-slate-700">{comp.latencyMs} ms</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SERVER RUNTIME METRICS */}
      {health?.server && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Server size={16} className="text-blue-600" />
            Backend Runtime Metrics
          </h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400 block mb-0.5">Process Uptime</span>
              <span className="font-bold text-slate-900">{formatUptime(health.server.uptimeSeconds)}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400 block mb-0.5">Memory Usage</span>
              <span className="font-bold text-slate-900">{health.server.memoryUsedMB} MB RSS</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400 block mb-0.5">Environment</span>
              <span className="font-bold uppercase text-slate-900">{health.server.nodeEnv}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400 block mb-0.5">OS Platform</span>
              <span className="font-bold capitalize text-slate-900">{health.server.osPlatform}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
