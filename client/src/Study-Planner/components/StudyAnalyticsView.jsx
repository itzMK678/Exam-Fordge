import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";

export default function StudyAnalyticsView({ plan }) {
  const tasks = plan?.tasks || [];
  const mappings = plan?.mappings || [];
  const exams = plan?.exams || [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const skippedTasks = tasks.filter((t) => t.status === "skipped").length;
  const pendingTasks = totalTasks - completedTasks - skippedTasks;
  const overallPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalPlannedMinutes = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  const completedMinutes = tasks.filter((t) => t.status === "completed").reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

  const totalPlannedHours = Math.round((totalPlannedMinutes / 60) * 10) / 10;
  const completedHours = Math.round((completedMinutes / 60) * 10) / 10;

  // Task types breakdown
  const learningTasks = tasks.filter((t) => t.task_type === "learning");
  const practiceTasks = tasks.filter((t) => t.task_type === "practice");
  const revisionTasks = tasks.filter((t) => t.task_type === "revision");
  const mockTasks = tasks.filter((t) => t.task_type === "mock_test");

  const calcTypeProgress = (list) => {
    if (list.length === 0) return 0;
    const done = list.filter((t) => t.status === "completed").length;
    return Math.round((done / list.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Overall Progress</span>
            <TrendingUp size={16} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {overallPercentage}%
          </p>
          <span className="text-[11px] font-medium text-slate-400">
            {completedTasks} of {totalTasks} tasks done
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Study Hours</span>
            <Clock size={16} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {completedHours} <span className="text-sm font-semibold text-slate-400">/ {totalPlannedHours}h</span>
          </p>
          <span className="text-[11px] font-medium text-slate-400">
            Hours completed so far
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Remaining Tasks</span>
            <BookOpen size={16} className="text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {pendingTasks}
          </p>
          <span className="text-[11px] font-medium text-slate-400">
            Pending across all subjects
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Target Exams</span>
            <Award size={16} className="text-rose-600" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {exams.length}
          </p>
          <span className="text-[11px] font-medium text-slate-400">
            Under active preparation
          </span>
        </div>
      </div>

      {/* Task Type Completion Breakdown */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <h4 className="text-sm font-extrabold text-slate-900 mb-4">
          Preparation Breakdown by Activity Type
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "First-Time Learning",
              list: learningTasks,
              color: "from-emerald-500 to-teal-500",
              desc: "Reading definitions, chapters, and concepts",
            },
            {
              title: "Problem Practice",
              list: practiceTasks,
              color: "from-blue-500 to-indigo-500",
              desc: "Solving exercises and application problems",
            },
            {
              title: "Spaced Revision",
              list: revisionTasks,
              color: "from-purple-500 to-pink-500",
              desc: "Reviewing formulas and memory consolidation",
            },
            {
              title: "Mock Exams",
              list: mockTasks,
              color: "from-amber-500 to-rose-500",
              desc: "Timed full-length test simulations",
            },
          ].map((cat) => {
            const pct = calcTypeProgress(cat.list);
            const done = cat.list.filter((t) => t.status === "completed").length;
            return (
              <div
                key={cat.title}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{cat.title}</span>
                  <span className="font-black text-indigo-700">{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{done}/{cat.list.length} completed</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {cat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Exams Countdown Cards */}
      <div className="space-y-3">
        <h4 className="text-sm font-extrabold text-slate-900">
          Target Exams Schedule
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exams.map((ex) => {
            const exDate = new Date(ex.exam_date + "T00:00:00");
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((exDate - today) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={ex.id}
                className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div>
                  <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-indigo-700">
                    {ex.subject} â€¢ {ex.test_type}
                  </span>
                  <h5 className="text-base font-bold text-slate-900 mt-1">
                    {ex.exam_name}
                  </h5>
                  <span className="text-xs text-slate-400">
                    Date: {ex.exam_date}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-rose-600">
                    {diffDays > 0 ? diffDays : 0}
                  </span>
                  <span className="block text-[11px] font-bold text-slate-400">
                    days remaining
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
