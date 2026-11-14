import {
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Sparkles,
  BookOpen,
  AlertCircle,
} from "lucide-react";

export default function TimelineScheduleView({ plan, onSelectDate }) {
  const tasks = plan?.tasks || [];
  const exams = plan?.exams || [];

  // Group tasks by date
  const dateMap = {};
  tasks.forEach((t) => {
    if (!dateMap[t.scheduled_date]) dateMap[t.scheduled_date] = [];
    dateMap[t.scheduled_date].push(t);
  });

  const sortedDates = Object.keys(dateMap).sort();
  const todayStr = new Date().toISOString().split("T")[0];

  const getExamsOnDate = (dateStr) => {
    return exams.filter((e) => e.exam_date === dateStr);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
          Exam Preparation Journey & Milestones
        </h3>
        <p className="text-xs text-slate-500">
          Chronological milestone progression from current date to final exams
        </p>
      </div>

      <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-100 space-y-8 my-6">
        {sortedDates.map((dateStr, idx) => {
          const dayTasks = dateMap[dateStr] || [];
          const dayExams = getExamsOnDate(dateStr);
          const isToday = dateStr === todayStr;
          const completedCount = dayTasks.filter((t) => t.status === "completed").length;
          const isAllDone = dayTasks.length > 0 && completedCount === dayTasks.length;

          const dateObj = new Date(dateStr + "T00:00:00");
          const formattedDate = dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          return (
            <div key={dateStr} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                  dayExams.length > 0
                    ? "border-rose-500 bg-rose-500 text-white shadow-md animate-bounce"
                    : isToday
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                    : isAllDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-indigo-200 bg-white text-indigo-600"
                }`}
              >
                {dayExams.length > 0 ? (
                  <Flag size={14} />
                ) : isAllDone ? (
                  <CheckCircle2 size={14} />
                ) : isToday ? (
                  <Sparkles size={14} />
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Day Milestone Card */}
              <div
                className={`rounded-3xl border p-5 transition ${
                  dayExams.length > 0
                    ? "border-rose-200 bg-rose-50/40"
                    : isToday
                    ? "border-indigo-300 bg-indigo-50/30 shadow-xs"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      {formattedDate}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                        Today
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-slate-500">
                    {completedCount}/{dayTasks.length} tasks completed
                  </span>
                </div>

                {/* Exam Alert Banner if Exam Day */}
                {dayExams.map((ex) => (
                  <div
                    key={ex.id}
                    className="mb-4 flex items-center justify-between rounded-2xl bg-rose-600 px-4 py-2.5 text-white shadow-sm"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <Flag size={16} />
                      <span>{ex.exam_name} ({ex.subject}) â€” Examination Day</span>
                    </div>
                    <span className="rounded-lg bg-rose-700 px-2 py-0.5 text-[11px] font-black uppercase">
                      {ex.test_type}
                    </span>
                  </div>
                ))}

                {/* Day Tasks List */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-2xl border p-3 text-xs transition ${
                        t.status === "completed"
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-800">{t.title}</span>
                        <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 shrink-0">
                          {t.estimated_minutes}m
                        </span>
                      </div>
                      <span className="block text-[11px] text-slate-500 mt-1">
                        {t.subject} â€¢ {t.task_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
