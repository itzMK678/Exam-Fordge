import { useState } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function WeeklyScheduleView({ plan, onTaskUpdated, onSelectDate }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const tasks = plan?.tasks || [];
  const dailyHoursLimit = plan?.daily_study_hours || 3.0;

  // Generate 7 days for the current week window
  const getWeekDays = () => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);

    // Find Monday of this week
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(monday.getDate() - distanceToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const todayStr = new Date().toISOString().split("T")[0];

  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Week Navigator */}
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
            Weekly Workload Distribution
          </h3>
          <p className="text-xs text-slate-500">
            Balanced daily study allocation ({dailyHoursLimit} hrs target per day)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-white hover:text-slate-900 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-white transition"
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-white hover:text-slate-900 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 7 Columns Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {weekDays.map((dStr) => {
          const isToday = dStr === todayStr;
          const daysTasks = tasks.filter((t) => t.scheduled_date === dStr);
          const totalMins = daysTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
          const totalHours = Math.round((totalMins / 60) * 10) / 10;
          const completedCount = daysTasks.filter((t) => t.status === "completed").length;

          return (
            <div
              key={dStr}
              className={`rounded-3xl border p-4 flex flex-col justify-between transition ${
                isToday
                  ? "border-indigo-600 bg-indigo-50/20 shadow-xs"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div>
                    <span
                      className={`text-xs font-extrabold ${
                        isToday ? "text-indigo-600" : "text-slate-900"
                      }`}
                    >
                      {getDayLabel(dStr)}
                    </span>
                    {isToday && (
                      <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-600">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    {completedCount}/{daysTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-2">
                  {daysTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] font-medium text-slate-400 italic">
                      No tasks scheduled
                    </div>
                  ) : (
                    daysTasks.map((t) => {
                      const isDone = t.status === "completed";
                      return (
                        <div
                          key={t.id}
                          className={`rounded-2xl border p-2.5 text-xs transition ${
                            isDone
                              ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
                              : "border-slate-200 bg-slate-50/70 hover:border-indigo-200"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() =>
                                onTaskUpdated(t.id, {
                                  status: isDone ? "pending" : "completed",
                                })
                              }
                              className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition"
                            >
                              {isDone ? (
                                <CheckCircle2 size={16} className="text-emerald-600" />
                              ) : (
                                <Circle size={16} />
                              )}
                            </button>
                            <div className="truncate">
                              <span
                                className={`block font-bold truncate ${
                                  isDone ? "line-through text-slate-400" : "text-slate-800"
                                }`}
                              >
                                {t.title}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                                <Clock size={10} />
                                <span>{t.estimated_minutes}m</span>
                                <span>â€¢ {t.subject}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Day Bottom Stat */}
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400">Total:</span>
                <span
                  className={
                    totalHours > dailyHoursLimit
                      ? "text-rose-600"
                      : "text-slate-700"
                  }
                >
                  {totalHours} / {dailyHoursLimit}h
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
