import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ActivityLogsSection() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        action: actionFilter,
        page: String(page),
        limit: "15",
      });

      const res = await fetch(`${API_URL}/api/admin/logs?${query.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.warn("Logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const getActionBadge = (action = "") => {
    if (action.includes("DELETE")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (action.includes("BLOCK")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (action.includes("RESET")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (action.includes("LOGIN")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            Admin Activity Audit Trail ({total})
          </h2>
          <p className="text-xs text-slate-500">
            Immutable log of all administrative actions, password resets, account deletions, and system updates.
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="all">All Actions</option>
          <option value="ADMIN_LOGIN_SUCCESS">Admin Login</option>
          <option value="USER_BLOCK">User Block</option>
          <option value="USER_UNBLOCK">User Unblock</option>
          <option value="USER_PASSWORD_RESET">Password Reset</option>
          <option value="USER_DELETE">User Deletion</option>
          <option value="DOCUMENT_DELETE">Document Deletion</option>
          <option value="EXAM_DELETE">Exam Deletion</option>
          <option value="ADMIN_CREDENTIALS_UPDATE">Credentials Change</option>
        </select>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Admin</th>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Target</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans text-xs">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50/60 font-sans">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {log.admin_username}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-slate-600">
                      {log.target_type || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[10px]">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(log.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 font-sans">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
