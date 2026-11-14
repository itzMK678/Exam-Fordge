import { useState, useEffect } from "react";
import {
  MessageSquare,
  Filter,
  CheckCircle2,
  Clock,
  Star,
  Loader2,
  AlertCircle,
  Tag,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function FeedbackSection() {
  const [feedback, setFeedback] = useState([]);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        category: categoryFilter,
        status: statusFilter,
      });

      const res = await fetch(`${API_URL}/api/admin/feedback?${query.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.feedback || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.warn("Feedback fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [categoryFilter, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setFeedback((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
        );
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            Feedback & Support ({total})
          </h2>
          <p className="text-xs text-slate-500">
            Review student bug reports, feature suggestions, ratings, and questions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="bug">Bug Reports</option>
            <option value="feature_request">Feature Requests</option>
            <option value="feedback">General Feedback</option>
            <option value="issue">Issue</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* FEEDBACK LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
            Loading feedback items...
          </div>
        ) : feedback.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            <MessageSquare size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No feedback entries found.</p>
          </div>
        ) : (
          feedback.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-slate-300"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                    {item.category?.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {item.user_name || "Student"}
                  </span>
                  {item.user_email && (
                    <span className="text-xs text-slate-400">({item.user_email})</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {item.rating && (
                    <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span>{item.rating} / 5</span>
                    </div>
                  )}

                  <select
                    value={item.status || "pending"}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-800 sm:text-sm">
                {item.message}
              </p>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>
                  Submitted: {new Date(item.created_at).toLocaleDateString()}
                </span>
                {item.admin_notes && (
                  <span className="italic text-slate-600">Note: {item.admin_notes}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
