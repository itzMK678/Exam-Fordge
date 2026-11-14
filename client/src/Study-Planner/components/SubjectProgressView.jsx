import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function SubjectProgressView({ plan, onSelectDate }) {
  const tasks = plan?.tasks || [];
  const exams = plan?.exams || [];
  const mappings = plan?.mappings || [];

  // Group by subject
  const subjectsMap = {};

  mappings.forEach((m) => {
    const s = m.subject || "General";
    if (!subjectsMap[s]) {
      subjectsMap[s] = {
        name: s,
        topics: [],
        tasks: [],
        exams: [],
      };
    }
    subjectsMap[s].topics.push(m);
  });

  tasks.forEach((t) => {
    const s = t.subject || "General";
    if (!subjectsMap[s]) {
      subjectsMap[s] = { name: s, topics: [], tasks: [], exams: [] };
    }
    subjectsMap[s].tasks.push(t);
  });

  exams.forEach((e) => {
    const s = e.subject || "General";
    if (!subjectsMap[s]) {
      subjectsMap[s] = { name: s, topics: [], tasks: [], exams: [] };
    }
    subjectsMap[s].exams.push(e);
  });

  const subjects = Object.values(subjectsMap);

  const getDaysUntil = (dateStr) => {
    try {
      const target = new Date(dateStr + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "Today!";
      if (diff === 1) return "Tomorrow!";
      if (diff < 0) return "Completed";
      return `${diff} days left`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
            Subject-Wise Preparation Progress
          </h3>
          <p className="text-xs text-slate-500">
            Track syllabus completion, study hours, and exam deadlines by subject
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {subjects.map((sub) => {
          const totalTasks = sub.tasks.length;
          const completedTasks = sub.tasks.filter((t) => t.status === "completed").length;
          const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const totalMinutes = sub.tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
          const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

          // Closest upcoming exam
          const nextExam = sub.exams
            .slice()
            .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))[0];

          return (
            <div
              key={sub.name}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-extrabold text-base">
                      {sub.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{sub.name}</h4>
                      <span className="text-xs text-slate-400 font-medium">
                        {sub.topics.length} syllabus topics â€¢ {totalHours} study hrs
                      </span>
                    </div>
                  </div>

                  {nextExam && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1 text-right">
                      <span className="block text-[10px] font-bold uppercase text-rose-500">
                        {nextExam.exam_name}
                      </span>
                      <span className="text-xs font-black text-rose-700">
                        {getDaysUntil(nextExam.exam_date)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Syllabus Completion</span>
                    <span className="text-indigo-600 font-black">{progressPercent}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{completedTasks} tasks completed</span>
                    <span>{totalTasks - completedTasks} remaining</span>
                  </div>
                </div>

                {/* Topics Preview */}
                <div className="mt-5 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Key Topics
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {sub.topics.slice(0, 5).map((top, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {top.topic}
                      </span>
                    ))}
                    {sub.topics.length > 5 && (
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                        +{sub.topics.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Stat */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-600" />
                  {totalHours} planned hours
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <CheckCircle2 size={14} />
                  {completedTasks} / {totalTasks} done
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
