import { useState, useEffect } from "react";
import {
  GraduationCap,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ExamsSection() {
  const [exams, setExams] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Modal
  const [inspectExam, setInspectExam] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        difficulty: difficultyFilter,
        page: String(page),
        limit: "12",
      });

      const res = await fetch(`${API_URL}/api/admin/exams?${query.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setExams(data.exams || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setStats({
          difficultyBreakdown: data.difficultyBreakdown || {},
          popularTopics: data.popularTopics || [],
        });
      }
    } catch (err) {
      console.warn("Fetch exams error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [page, difficultyFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExams();
  };

  const handleInspect = async (examId) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`${API_URL}/api/admin/exams/${examId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setInspectExam(data.data);
      }
    } catch (err) {
      alert("Failed to load exam details: " + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteExam = async (examId, title) => {
    if (!window.confirm(`Delete exam "${title}"? This will remove all associated AI tutor chats.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/exams/${examId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete exam.");

      setExams((prev) => prev.filter((e) => e.id !== examId));
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
            Exam Management ({total})
          </h2>
          <p className="text-xs text-slate-500">
            Inspect generated exam papers, review questions and answers, and manage study sessions.
          </p>
        </div>
      </div>

      {/* DIFFICULTY BREAKDOWN CARDS */}
      {stats?.difficultyBreakdown && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["Easy", "Medium", "Hard", "Mixed"].map((diff) => (
            <div
              key={diff}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {diff} Difficulty
              </span>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {stats.difficultyBreakdown[diff] || 0}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search exam title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>
      </div>

      {/* EXAMS DATA TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Exam Title</th>
                <th className="px-5 py-3.5">Difficulty</th>
                <th className="px-5 py-3.5 text-center">Questions</th>
                <th className="px-5 py-3.5">Student / Creator</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading exam sessions...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No exam sessions found.
                  </td>
                </tr>
              ) : (
                exams.map((ex) => (
                  <tr key={ex.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{ex.title}</p>
                      {ex.focus_topics && (
                        <p className="text-[11px] text-indigo-600 font-medium">
                          {ex.focus_topics}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {ex.difficulty || "Mixed"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                      {ex.total_questions || 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{ex.creatorName}</p>
                      <p className="text-[11px] text-slate-400">{ex.creatorEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(ex.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleInspect(ex.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer"
                          title="Inspect questions"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(ex.id, ex.title)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          title="Delete Exam"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* INSPECT EXAM MODAL */}
      {inspectExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                  {inspectExam.difficulty} Difficulty · {inspectExam.total_questions} Questions
                </span>
                <h3 className="text-lg font-black text-slate-900">{inspectExam.title}</h3>
                {inspectExam.creator && (
                  <p className="text-xs text-slate-500">
                    Created by: {inspectExam.creator.name} ({inspectExam.creator.email})
                  </p>
                )}
              </div>
              <button
                onClick={() => setInspectExam(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {inspectExam.parsedExam?.questions?.map((q, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      Q{idx + 1}. {q.question}
                    </span>
                    <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                      {q.type?.toUpperCase()}
                    </span>
                  </div>

                  {q.type === "mcq" && q.options && (
                    <div className="grid gap-1.5 sm:grid-cols-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`rounded-xl border px-3 py-2 text-xs flex items-center justify-between ${
                            opt === q.correctAnswer
                              ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-bold"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                          {opt === q.correctAnswer && <CheckCircle2 size={13} className="text-emerald-600" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {(q.correctAnswer || q.answer) && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-xs text-emerald-950">
                      <span className="font-bold text-emerald-800">Model Answer: </span>
                      {q.correctAnswer || q.answer}
                    </div>
                  )}

                  {q.explanation && (
                    <p className="text-[11px] text-slate-500 italic">
                      Explanation: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectExam(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
