import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  FileText,
  Clock,
  Printer,
  Plus,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Trash2,
  AlertCircle,
  Check,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SmartScheduleView({
  plan,
  onTaskUpdated,
  onOpenAssistantWithTopic,
}) {
  const [addingTopicDay, setAddingTopicDay] = useState(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicTime, setNewTopicTime] = useState(60);
  const [newTopicDoc, setNewTopicDoc] = useState("");
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [targetMoveDate, setTargetMoveDate] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const tasks = plan?.tasks || [];
  const exams = plan?.exams || [];
  const primaryExam = exams[0] || {};
  const subjectName = primaryExam.subject || plan?.title || "Exam Subject";

  // Calculate days remaining from today
  const todayStr = new Date().toISOString().split("T")[0];
  const targetDateStr = primaryExam.exam_date || (tasks.length > 0 ? tasks[tasks.length - 1].scheduled_date : todayStr);

  const daysRemaining = useMemo(() => {
    try {
      const diffMs = new Date(targetDateStr).getTime() - new Date(todayStr).getTime();
      return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 7;
    }
  }, [targetDateStr, todayStr]);

  // Group tasks by scheduled date to form Day 1, Day 2, Day 3...
  const groupedDays = useMemo(() => {
    const map = new Map();

    tasks.forEach((task) => {
      const dateKey = task.scheduled_date || todayStr;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(task);
    });

    // Sort dates chronologically
    const sortedDates = Array.from(map.keys()).sort();

    return sortedDates.map((dateKey, index) => {
      const dayTasks = map.get(dateKey) || [];
      const totalEstimatedMinutes = dayTasks.reduce((sum, t) => sum + (t.estimated_minutes || 60), 0);
      const isCompleted = dayTasks.length > 0 && dayTasks.every((t) => t.status === "completed");

      // Format date label
      let dateLabel = dateKey;
      let dayOfWeek = "";
      try {
        const d = new Date(dateKey + "T00:00:00");
        dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dayOfWeek = d.toLocaleDateString("en-US", { weekday: "long" });
      } catch {
        // fallback
      }

      return {
        dayNumber: index + 1,
        dateKey,
        dateLabel,
        dayOfWeek,
        tasks: dayTasks,
        totalHours: (totalEstimatedMinutes / 60).toFixed(1),
        isCompleted,
      };
    });
  }, [tasks, todayStr]);

  // Progress metrics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
  const remainingTasksCount = totalTasksCount - completedTasksCount;
  const progressPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Toggle completion status
  const handleToggleStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`${API_URL}/api/study-planner/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onTaskUpdated(taskId, { status: newStatus });
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Move a task to a different day/date
  const handleMoveTask = async (taskId, newDate) => {
    if (!newDate) return;
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`${API_URL}/api/study-planner/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scheduled_date: newDate }),
      });
      if (res.ok) {
        onTaskUpdated(taskId, { scheduled_date: newDate });
        setMovingTaskId(null);
      }
    } catch (err) {
      console.error("Failed to move task:", err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Add a new topic to a specific day
  const handleAddTopicToDay = async (dateKey) => {
    if (!newTopicName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/study-planner/${plan.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scheduled_date: dateKey,
          topic: newTopicName.trim(),
          title: newTopicName.trim(),
          estimated_minutes: Number(newTopicTime) || 60,
          document_name: newTopicDoc.trim() || "Manually Added",
          subject: subjectName,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          onTaskUpdated(json.data.id, json.data);
        }
        setAddingTopicDay(null);
        setNewTopicName("");
        setNewTopicDoc("");
      }
    } catch (err) {
      console.error("Failed to add topic:", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* =========================================================
          SECTION 5: PROGRESS TRACKING & DASHBOARD HEADER
      ========================================================= */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100 print:pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs font-bold text-xs">
                <BookOpen size={13} />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                {subjectName}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {plan.title || `${subjectName} – Exam Preparation Plan`}
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-indigo-700">
              Exam Preparation: <span className="font-extrabold text-indigo-900">{daysRemaining} Days Remaining</span>
            </p>
          </div>

          {/* Action Buttons: Print on Paper & AI Chat */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition cursor-pointer"
              title="Print clean schedule on paper"
            >
              <Printer size={15} />
              <span>Print Schedule on Paper</span>
            </button>
          </div>
        </div>

        {/* Progress Metrics Bar */}
        <div className="mt-6 space-y-4 print:mt-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Overall Preparation Progress</span>
            <span className="text-indigo-600 text-sm font-black">{progressPercentage}% Prepared</span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Topics</span>
              <span className="text-lg font-black text-slate-900">{totalTasksCount}</span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Completed</span>
              <span className="text-lg font-black text-emerald-600">{completedTasksCount}</span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Remaining</span>
              <span className="text-lg font-black text-amber-600">{remainingTasksCount}</span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Days Left</span>
              <span className="text-lg font-black text-indigo-600">{daysRemaining} Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 3: THE GENERATED SCHEDULE TABLE / CARDS
      ========================================================= */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:bg-white print:p-2">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Day-by-Day Study Roadmap
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow this verified order to cover all foundational and complex topics with their associated study materials.
            </p>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Study Schedule Table"
          className="overflow-x-auto"
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-black uppercase tracking-wider text-slate-600 print:bg-slate-100">
                <th className="py-3.5 px-4 sm:px-6 w-32">Day</th>
                <th className="py-3.5 px-4 sm:px-6">Topics & Concepts</th>
                <th className="py-3.5 px-4 sm:px-6 w-48">Study Material</th>
                <th className="py-3.5 px-4 sm:px-6 w-32">Est. Time</th>
                <th className="py-3.5 px-4 sm:px-6 w-36 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 w-24 text-right print:hidden">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {groupedDays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No scheduled tasks found for this plan. Click "+ Add Topic" to add your first day.
                  </td>
                </tr>
              ) : (
                groupedDays.map((day) => {
                  return (
                    <tr
                      key={day.dateKey}
                      className={`transition ${
                        day.isCompleted
                          ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* 1. Day Column */}
                      <td className="py-4 px-4 sm:px-6 align-top">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">
                            Day {day.dayNumber}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-600">
                            {day.dateLabel}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {day.dayOfWeek}
                          </span>
                        </div>
                      </td>

                      {/* 2. Topics & Important Concepts */}
                      <td className="py-4 px-4 sm:px-6 align-top">
                        <div className="space-y-3">
                          {day.tasks.map((task) => {
                            const isDone = task.status === "completed";
                            return (
                              <div
                                key={task.id}
                                className={`group/item rounded-xl p-2.5 transition ${
                                  isDone
                                    ? "bg-slate-50 text-slate-400 line-through"
                                    : "bg-white border border-slate-100 shadow-2xs text-slate-800"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                                      {task.topic || task.title}
                                    </h4>

                                    {task.description && (
                                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed not-italic">
                                        {task.description}
                                      </p>
                                    )}

                                    {task.subtopic && (
                                      <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 not-italic">
                                        Focus: {task.subtopic}
                                      </span>
                                    )}
                                  </div>

                                  {/* Quick AI tutor button on this specific topic */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenAssistantWithTopic &&
                                      onOpenAssistantWithTopic(`Explain the key formulas and concepts for: ${task.topic}`)
                                    }
                                    className="opacity-0 group-hover/item:opacity-100 transition rounded-lg p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 print:hidden cursor-pointer"
                                    title="Ask AI Tutor about this topic"
                                  >
                                    <Sparkles size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Inline Add Topic to this Day */}
                          {addingTopicDay === day.dateKey ? (
                            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-2 mt-2 print:hidden">
                              <input
                                type="text"
                                placeholder="Enter additional topic name..."
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold outline-none"
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Document name (optional)"
                                  value={newTopicDoc}
                                  onChange={(e) => setNewTopicDoc(e.target.value)}
                                  className="w-1/2 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs outline-none"
                                />
                                <input
                                  type="number"
                                  placeholder="Minutes"
                                  value={newTopicTime}
                                  onChange={(e) => setNewTopicTime(Number(e.target.value))}
                                  className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-center outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddTopicToDay(day.dateKey)}
                                  className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAddingTopicDay(null)}
                                  className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingTopicDay(day.dateKey)}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 print:hidden cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add topic to Day {day.dayNumber}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 3. Study Material Badges & Links */}
                      <td className="py-4 px-4 sm:px-6 align-top">
                        <div className="space-y-1.5">
                          {day.tasks.map((task) => {
                            const docName = task.document_name || "Manually Added";
                            const isManual = docName.toLowerCase().includes("manual");

                            return (
                              <div
                                key={task.id}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                                  isManual
                                    ? "border-slate-200 bg-slate-50 text-slate-600"
                                    : "border-blue-200 bg-blue-50 text-blue-700"
                                }`}
                              >
                                <FileText size={13} className={isManual ? "text-slate-400" : "text-blue-600"} />
                                <span className="max-w-[130px] truncate" title={docName}>
                                  {docName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* 4. Estimated Time */}
                      <td className="py-4 px-4 sm:px-6 align-top">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <Clock size={14} className="text-slate-400" />
                          <span>{day.totalHours} hrs</span>
                        </div>
                      </td>

                      {/* 5. Completion Status Checkbox */}
                      <td className="py-4 px-4 sm:px-6 align-top text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          {day.tasks.map((task) => {
                            const isDone = task.status === "completed";
                            return (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => handleToggleStatus(task.id, task.status)}
                                disabled={updatingTaskId === task.id}
                                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                                  isDone
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs"
                                }`}
                                title={isDone ? "Mark Incomplete" : "Mark Completed"}
                              >
                                {isDone ? (
                                  <>
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    <span>Completed</span>
                                  </>
                                ) : (
                                  <>
                                    <Circle size={14} className="text-slate-300" />
                                    <span>To Study</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* 6. Shift Day / Move Actions */}
                      <td className="py-4 px-4 sm:px-6 align-top text-right print:hidden">
                        {day.tasks.length > 0 && (
                          <div className="relative inline-block text-left">
                            {movingTaskId === day.tasks[0]?.id ? (
                              <div className="flex flex-col gap-1 rounded-xl border border-indigo-200 bg-white p-2 shadow-lg absolute right-0 z-20 w-44">
                                <span className="text-[10px] font-bold text-slate-400">
                                  Move to Date:
                                </span>
                                <input
                                  type="date"
                                  value={targetMoveDate}
                                  onChange={(e) => setTargetMoveDate(e.target.value)}
                                  className="rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                                />
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTask(day.tasks[0]?.id, targetMoveDate)}
                                    className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white"
                                  >
                                    Move
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMovingTaskId(null)}
                                    className="text-[10px] text-slate-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setMovingTaskId(day.tasks[0]?.id);
                                  setTargetMoveDate(day.dateKey);
                                }}
                                className="text-slate-400 hover:text-indigo-600 transition p-1"
                                title="Move topics to another day"
                              >
                                <RefreshCw size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
