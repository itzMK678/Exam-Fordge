import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Flag,
} from "lucide-react";

export default function CalendarScheduleView({ plan, onSelectDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const tasks = plan?.tasks || [];
  const exams = plan?.exams || [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group tasks by "YYYY-MM-DD"
  const tasksByDate = {};
  tasks.forEach((t) => {
    if (!tasksByDate[t.scheduled_date]) tasksByDate[t.scheduled_date] = [];
    tasksByDate[t.scheduled_date].push(t);
  });

  // Group exams by "YYYY-MM-DD"
  const examsByDate = {};
  exams.forEach((e) => {
    if (!examsByDate[e.exam_date]) examsByDate[e.exam_date] = [];
    examsByDate[e.exam_date].push(e);
  });

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Calendar Header Navigation */}
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-slate-500">
              Click any day to view or check off scheduled study tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-white hover:text-slate-900 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-white transition"
          >
            Current Month
          </button>
          <button
            onClick={nextMonth}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-white hover:text-slate-900 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 pb-3 border-b border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2 pt-3">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] rounded-2xl bg-slate-50/50 p-2" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: totalDaysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayTasks = tasksByDate[dateStr] || [];
            const dayExams = examsByDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const completedCount = dayTasks.filter((t) => t.status === "completed").length;

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDate && onSelectDate(dateStr)}
                className={`min-h-[110px] rounded-2xl border p-2.5 transition flex flex-col justify-between cursor-pointer ${
                  isToday
                    ? "border-indigo-600 bg-indigo-50/30 shadow-xs"
                    : dayTasks.length > 0 || dayExams.length > 0
                    ? "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs"
                    : "border-slate-100 bg-slate-50/60 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-slate-800"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {completedCount}/{dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Exam Pin Flag */}
                  {dayExams.map((ex) => (
                    <div
                      key={ex.id}
                      className="mb-1 rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-700 truncate flex items-center gap-1"
                      title={ex.exam_name}
                    >
                      <Flag size={10} className="shrink-0 text-rose-600" />
                      <span className="truncate">{ex.exam_name}</span>
                    </div>
                  ))}

                  {/* Tasks Preview */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate ${
                          t.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 line-through"
                            : t.task_type === "mock_test"
                            ? "bg-amber-50 text-amber-800 font-bold"
                            : t.task_type === "revision"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="block text-[10px] font-bold text-slate-400 pl-1">
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Duration Sum */}
                {dayTasks.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-slate-100 flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <Clock size={9} />
                    <span>
                      {Math.round(
                        dayTasks.reduce((acc, t) => acc + (t.estimated_minutes || 0), 0) / 60 * 10
                      ) / 10}{" "}
                      hrs
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
