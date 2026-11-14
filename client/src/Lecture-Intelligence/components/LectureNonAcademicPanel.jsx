import { Bell, Calendar, Coffee, ClipboardList, Clock } from "lucide-react";

export default function LectureNonAcademicPanel({ nonAcademic = [] }) {
  if (!nonAcademic || nonAcademic.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        <Bell size={32} className="mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-semibold">
          No announcements, deadlines or non-academic chatter detected.
        </p>
        <p className="mt-1 text-xs">
          The teacher remained strictly focused on academic content!
        </p>
      </div>
    );
  }

  const getCategoryConfig = (category = "") => {
    const c = category.toLowerCase();
    if (c.includes("deadline")) {
      return {
        icon: Calendar,
        label: "Upcoming Deadline",
        badge: "bg-rose-100 text-rose-700 border-rose-200",
        box: "border-rose-100 bg-rose-50/40",
      };
    }
    if (c.includes("assignment")) {
      return {
        icon: ClipboardList,
        label: "Assignment Notice",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        box: "border-amber-100 bg-amber-50/40",
      };
    }
    if (c.includes("announcement")) {
      return {
        icon: Bell,
        label: "Class Announcement",
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        box: "border-blue-100 bg-blue-50/40",
      };
    }
    return {
      icon: Coffee,
      label: "Casual Chatter / Banter",
      badge: "bg-slate-100 text-slate-600 border-slate-200",
      box: "border-slate-100 bg-slate-50/60",
    };
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          <Bell size={13} /> Filtered Non-Academic Talk
        </span>
        <h3 className="mt-2 text-lg font-bold text-slate-900">
          Announcements, Deadlines & Casual Discussion
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          These items were filtered out of your study notes so you can focus strictly on what matters for exams.
        </p>
      </div>

      <div className="space-y-3">
        {nonAcademic.map((item, idx) => {
          const config = getCategoryConfig(item.category);
          const Icon = config.icon;
          return (
            <div
              key={idx}
              className={`rounded-2xl border p-4 transition ${config.box}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${config.badge}`}
                >
                  <Icon size={13} />
                  {config.label}
                </span>

                {item.timestamp && (
                  <span className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    <Clock size={10} />
                    {item.timestamp}
                  </span>
                )}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-800 sm:text-sm">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
