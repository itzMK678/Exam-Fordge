import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Edit3,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

export default function DailyScheduleView({
  plan,
  onTaskUpdated,
  onOpenAssistantWithTopic,
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [editingNotesTaskId, setEditingNotesTaskId] = useState(null);
  const [taskNotesInput, setTaskNotesInput] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const tasks = plan?.tasks || [];
  const daysTasks = tasks.filter((t) => t.scheduled_date === selectedDate);
  const completedCount = daysTasks.filter((t) => t.status === "completed").length;
  const dayProgress = daysTasks.length > 0 ? Math.round((completedCount / daysTasks.length) * 100) : 0;

  // Format date display
  const formatDateTitle = (dStr) => {
    try {
      const d = new Date(dStr + "T00:00:00");
      const isToday = dStr === todayStr;
      const formatted = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      return isToday ? `Today (${formatted})` : formatted;
    } catch {
      return dStr;
    }
  };

  const changeDay = (offset) => {
    try {
      const current = new Date(selectedDate + "T00:00:00");
      current.setDate(current.getDate() + offset);
      setSelectedDate(current.toISOString().split("T")[0]);
    } catch {
      // ignore
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`http://localhost:5000/api/study-planner/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onTaskUpdated(taskId, { status: newStatus });
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSaveNotes = async (taskId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/study-planner/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: taskNotesInput }),
      });
      if (res.ok) {
        onTaskUpdated(taskId, { notes: taskNotesInput });
        setEditingNotesTaskId(null);
      }
    } catch (err) {
      console.error("Failed to save task notes:", err);
    }
  };

  const getTaskTypeStyle = (type) => {
    switch (type) {
      case "learning":
        return { label: "First-Time Learning", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "practice":
        return { label: "Problem Practice", badge: "bg-blue-50 text-blue-700 border-blue-200" };
      case "revision":
        return { label: "Spaced Revision", badge: "bg-purple-50 text-purple-700 border-purple-200" };
      case "mock_test":
        return { label: "Full Mock Test", badge: "bg-amber-50 text-amber-700 border-amber-200" };
      case "past_paper":
        return { label: "Past Paper Solving", badge: "bg-rose-50 text-rose-700 border-rose-200" };
      default:
        return { label: "Study Task", badge: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Day Navigation & Progress Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => changeDay(-1)}
              className="rounded-xl p-2 text-slate-500 hover:bg-white hover:text-slate-900 transition"
              title="Previous Day"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedDate === todayStr
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => changeDay(1)}
              className="rounded-xl p-2 text-slate-500 hover:bg-white hover:text-slate-900 transition"
              title="Next Day"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
              {formatDateTitle(selectedDate)}
            </h3>
            <p className="text-xs text-slate-500">
              {daysTasks.length} {daysTasks.length === 1 ? "task" : "tasks"} scheduled for this date
            </p>
          </div>
        </div>

        {/* Day Completion Stats */}
        {daysTasks.length > 0 && (
          <div className="flex items-center gap-4 sm:border-l sm:border-slate-100 sm:pl-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500">Day Completion</span>
              <span className="text-lg font-black text-slate-900">
                {completedCount} / {daysTasks.length}{" "}
                <span className="text-xs font-medium text-slate-400">({dayProgress}%)</span>
              </span>
            </div>
            <div className="h-10 w-28 overflow-hidden rounded-full bg-slate-100 p-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${dayProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tasks List */}
      {daysTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Calendar size={28} />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            No Scheduled Tasks for {formatDateTitle(selectedDate)}
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Either this is an intentional rest / buffer day, or your preparation begins on an adjacent date.
          </p>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
          >
            Go to Today
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {daysTasks.map((task) => {
            const isCompleted = task.status === "completed";
            const isPartial = task.status === "partially_completed";
            const isSkipped = task.status === "skipped";
            const typeStyle = getTaskTypeStyle(task.task_type);

            return (
              <div
                key={task.id}
                className={`relative rounded-3xl border p-5 transition-all sm:p-6 ${
                  isCompleted
                    ? "border-emerald-200 bg-emerald-50/30"
                    : isSkipped
                    ? "border-slate-200 bg-slate-50/60 opacity-60"
                    : "border-slate-200 bg-white shadow-xs hover:border-indigo-200"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: Checkbox + Topic Details */}
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      disabled={updatingTaskId === task.id}
                      onClick={() =>
                        handleUpdateStatus(
                          task.id,
                          isCompleted ? "pending" : "completed"
                        )
                      }
                      className="mt-0.5 shrink-0 text-slate-300 hover:text-emerald-600 transition cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={24} className="text-emerald-600" />
                      ) : isPartial ? (
                        <FileCheck2 size={24} className="text-amber-500" />
                      ) : (
                        <Circle size={24} className="hover:text-indigo-600" />
                      )}
                    </button>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-700">
                          {task.subject}
                        </span>
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold ${typeStyle.badge}`}
                        >
                          {typeStyle.label}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <Clock size={12} />
                          {task.estimated_minutes} mins
                        </span>
                      </div>

                      <h4
                        className={`text-base font-bold text-slate-900 ${
                          isCompleted ? "line-through text-slate-500" : ""
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {task.description}
                        </p>
                      )}

                      {/* Material Reference Badge */}
                      {(task.document_name || task.page_reference) && (
                        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-indigo-900 bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-1.5 w-fit">
                          <BookOpen size={14} className="text-indigo-600 shrink-0" />
                          <span>
                            {task.document_name || "Study Material"}
                            {task.page_reference && ` â€¢ ${task.page_reference}`}
                          </span>
                        </div>
                      )}

                      {/* Personal Notes Display */}
                      {task.notes && editingNotesTaskId !== task.id && (
                        <div className="mt-2 text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 rounded-xl p-2.5">
                          <span className="font-bold text-amber-900">Your Note: </span>
                          {task.notes}
                        </div>
                      )}

                      {/* Editing Notes Input */}
                      {editingNotesTaskId === task.id && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={taskNotesInput}
                            onChange={(e) => setTaskNotesInput(e.target.value)}
                            placeholder="Add your study notes or questions..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-600"
                          />
                          <button
                            onClick={() => handleSaveNotes(task.id)}
                            className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNotesTaskId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 px-2"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions Menu */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenAssistantWithTopic) {
                          onOpenAssistantWithTopic(
                            `Can you explain ${task.topic} (${task.subtopic || ""}) from my study material and give me 2 practice questions?`
                          );
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition shadow-2xs cursor-pointer"
                      title="Ask AI Tutor"
                    >
                      <Sparkles size={13} className="text-indigo-600" />
                      <span>Ask AI Tutor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotesTaskId(task.id);
                        setTaskNotesInput(task.notes || "");
                      }}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                      title="Add Personal Note"
                    >
                      <Edit3 size={14} />
                    </button>

                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="partially_completed">Partial</option>
                      <option value="completed">Done</option>
                      <option value="skipped">Skip</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
