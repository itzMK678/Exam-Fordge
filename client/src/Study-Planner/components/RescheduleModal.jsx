import { useState } from "react";
import {
  X,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function RescheduleModal({ plan, onClose, onRescheduled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dailyHours, setDailyHours] = useState(plan?.daily_study_hours || 3.0);
  const [preferredDays, setPreferredDays] = useState(
    plan?.preferred_days || [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]
  );

  const completedCount = (plan?.tasks || []).filter((t) => t.status === "completed").length;
  const pendingCount = (plan?.tasks || []).length - completedCount;

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day) => {
    setPreferredDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day]
    );
  };

  const handleReschedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/study-planner/${plan.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          newDailyHours: dailyHours,
          newPreferredDays: preferredDays,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to recalculate study plan.");
      }

      onRescheduled(json.data);
    } catch (err) {
      setError(err.message || "Smart rescheduling failed.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Smart Reschedule Timetable
              </h3>
              <p className="text-xs text-slate-500">
                Recalibrate your study plan to adapt to missed sessions
              </p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="my-5 space-y-5">
          {/* Progress Preservation Guarantee */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <span className="font-extrabold block mb-0.5">
                Your Progress is 100% Preserved
              </span>
              All <span className="font-bold">{completedCount} completed study sessions</span> will remain permanently intact. AI will only redistribute the remaining <span className="font-bold">{pendingCount} pending topics</span> across your available days.
            </div>
          </div>

          {/* Adjust Available Daily Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-600" />
                Updated Daily Study Time
              </label>
              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-black text-indigo-700">
                {dailyHours} Hours / Day
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Preferred Study Days */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-600" />
              Active Study Days
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {allDays.map((day) => {
                const isSelected = preferredDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-xl py-1.5 px-1 text-center text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleReschedule}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:opacity-95 transition shadow-md"
          >
            <Sparkles size={15} />
            <span>{loading ? "Recalculating Schedule..." : "Recalculate & Apply"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
