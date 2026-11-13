import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("list"); // list -> exam -> question

  // ---- Exam list ----
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState("");

  // ---- Selected exam ----
  const [selectedExam, setSelectedExam] = useState(null);    // metadata
  const [examDetail, setExamDetail] = useState(null);         // full with questions
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ---- Selected question & discussion ----
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [discussion, setDiscussion] = useState(null);
  const [loadingDiscussion, setLoadingDiscussion] = useState(false);

  // ---- Deleting ----
  const [deletingExamId, setDeletingExamId] = useState(null);

  // ============================================================
  // Load all exams
  // ============================================================
  useEffect(() => {
    async function fetchExams() {
      setLoadingExams(true);
      setExamsError("");
      try {
        const res = await fetch(`${API_URL}/api/history/exams`, {
          credentials: "include",
        });
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load history.");
        setExams(data.data || []);
      } catch (err) {
        setExamsError(err.message);
      } finally {
        setLoadingExams(false);
      }
    }
    fetchExams();
  }, [navigate]);

  // ============================================================
  // Load exam detail (questions) when exam is selected
  // ============================================================
  async function selectExam(exam) {
    setSelectedExam(exam);
    setView("exam");
    setSelectedQuestion(null);
    setDiscussion(null);
    setExamDetail(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/api/history/exams/${exam.id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load exam.");
      setExamDetail(data.data);
    } catch (err) {
      setExamsError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  // ============================================================
  // Load discussion when question is selected
  // ============================================================
  async function selectQuestion(question) {
    setSelectedQuestion(question);
    setView("question");
    setDiscussion(null);
    setLoadingDiscussion(true);
    try {
      const uid = encodeURIComponent(question.uid || question.id);
      const res = await fetch(
        `${API_URL}/api/history/exams/${selectedExam.id}/discussions/${uid}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load discussion.");
      setDiscussion(data.data);
    } catch (err) {
      setDiscussion({ messages: [] });
    } finally {
      setLoadingDiscussion(false);
    }
  }

  // ============================================================
  // Delete exam
  // ============================================================
  async function deleteExam(examId, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this exam and all its chat history?")) return;
    setDeletingExamId(examId);
    try {
      const res = await fetch(`${API_URL}/api/history/exams/${examId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete.");
      setExams((prev) => prev.filter((e) => e.id !== examId));
      if (selectedExam?.id === examId) {
        setSelectedExam(null);
        setExamDetail(null);
        setView("list");
        setSelectedQuestion(null);
        setDiscussion(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingExamId(null);
    }
  }

  const typeLabel = { mcq: "MCQ", short: "Short", long: "Essay" };
  const typeBadge = {
    mcq: "bg-blue-50 text-blue-700 border-blue-100",
    short: "bg-amber-50 text-amber-700 border-amber-100",
    long: "bg-purple-50 text-purple-700 border-purple-100",
  };

  const viewIndex = view === "list" ? 0 : view === "exam" ? 1 : 2;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => navigate("/work")}
              className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:px-4 sm:text-sm"
            >
              Back to Generator
            </button>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <h1 className="truncate text-base font-black text-slate-900 sm:text-lg">
              My Exam History
            </h1>
          </div>
          <span className="hidden text-xs font-medium text-slate-400 sm:block">
            {view === "list" ? "Saved exams" : view === "exam" ? "Past paper" : "Question review"}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-6 sm:py-7">
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-400 sm:text-sm">
          <span className={view === "list" ? "font-bold text-indigo-600" : ""}>History</span>
          <span>/</span>
          <span className={view === "exam" ? "font-bold text-indigo-600" : ""}>
            {selectedExam?.title || "Past paper"}
          </span>
          {view === "question" && (
            <>
              <span>/</span>
              <span className="font-bold text-indigo-600">Question</span>
            </>
          )}
        </div>

        {/* The three screens slide horizontally instead of showing side-by-side panels. */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className="flex w-[300%] transition-transform duration-300 ease-in-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${viewIndex * 33.333333}%)` }}
          >
            {/* STEP 1: Saved exam list */}
            <section className="w-1/3 min-w-0">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Saved Exams</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Select a history topic to open its past paper.
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    {exams.length} {exams.length === 1 ? "exam" : "exams"}
                  </span>
                </div>
              </div>

              {loadingExams && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  Loading history...
                </div>
              )}

              {examsError && (
                <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {examsError}
                </div>
              )}

              {!loadingExams && exams.length === 0 && (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <div className="mb-3 text-4xl">📄</div>
                  <p className="text-sm font-semibold text-slate-700">No saved exams yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Generate an exam and it will appear here.
                  </p>
                  <button
                    onClick={() => navigate("/work")}
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                  >
                    Create Exam
                  </button>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => selectExam(exam)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") selectExam(exam);
                    }}
                    className="flex cursor-pointer items-center justify-between gap-3 px-4 py-4 transition hover:bg-indigo-50/60 focus:bg-indigo-50/60 focus:outline-none sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold leading-snug text-slate-800 sm:text-base">
                        {exam.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {exam.total_questions} questions · {exam.difficulty}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDate(exam.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        onClick={(e) => deleteExam(exam.id, e)}
                        disabled={deletingExamId === exam.id}
                        className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        title="Delete exam"
                        aria-label="Delete exam"
                      >
                        {deletingExamId === exam.id ? "…" : "🗑"}
                      </button>
                      <span className="text-lg text-slate-300">›</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* STEP 2: Past paper / questions */}
            <section className="w-1/3 min-w-0 border-x border-slate-100">
              <div className="sticky top-0 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
                <button
                  onClick={() => setView("list")}
                  className="mb-3 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 sm:text-sm"
                >
                   Back to history
                </button>
                <h2 className="break-words text-lg font-bold text-slate-900">
                  {selectedExam?.title || "Past Paper"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {examDetail?.questions?.length ?? selectedExam?.total_questions ?? 0} questions
                  {examDetail?.difficulty ? ` · ${examDetail.difficulty}` : ""}
                </p>
              </div>

              {!selectedExam && (
                <div className="px-6 py-16 text-center text-sm text-slate-400">
                  Select a history topic first.
                </div>
              )}

              {loadingDetail && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  Loading past paper...
                </div>
              )}

              {selectedExam && examDetail && (
                <div className="divide-y divide-slate-100">
                  {(examDetail.questions || []).map((q, idx) => (
                    <button
                      key={q.uid || q.id || idx}
                      onClick={() => selectQuestion(q)}
                      className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-indigo-50/60 focus:bg-indigo-50/60 focus:outline-none sm:px-6"
                    >
                      <span
                        className={`mt-0.5 shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold ${
                          typeBadge[q.type] || "border-slate-100 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {typeLabel[q.type] || q.type}
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-relaxed text-slate-700">
                        <span className="font-semibold text-slate-500">Q{idx + 1}. </span>
                        {q.question}
                      </span>
                      <span className="shrink-0 text-lg text-slate-300">›</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* STEP 3: Answer and saved tutor conversation */}
            <section className="w-1/3 min-w-0">
              <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
                <button
                  onClick={() => setView("exam")}
                  className="mb-3 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 sm:text-sm"
                >
                   Back to past paper
                </button>
                <h2 className="text-lg font-bold text-slate-900">Question & Discussion</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review the answer and previous AI Tutor chat.
                </p>
              </div>

              {!selectedQuestion && (
                <div className="px-6 py-16 text-center text-sm text-slate-400">
                  Select a question from the past paper.
                </div>
              )}

              {selectedQuestion && (
                <div className="mx-auto max-w-3xl space-y-6 px-4 py-5 sm:px-6 sm:py-7">
                  <div>
                    <span
                      className={`mb-3 inline-block rounded-md border px-2 py-1 text-xs font-bold ${
                        typeBadge[selectedQuestion.type] ||
                        "border-slate-100 bg-slate-50 text-slate-500"
                      }`}
                    >
                      {typeLabel[selectedQuestion.type] || selectedQuestion.type}
                    </span>
                    <p className="break-words text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
                      {selectedQuestion.question}
                    </p>
                  </div>

                  {selectedQuestion.type === "mcq" && selectedQuestion.options?.length > 0 && (
                    <div className="space-y-2">
                      {selectedQuestion.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border px-4 py-3 text-sm ${
                            opt === selectedQuestion.correctAnswer
                              ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                          {opt === selectedQuestion.correctAnswer && (
                            <span className="ml-2 text-xs text-emerald-600">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {(selectedQuestion.correctAnswer || selectedQuestion.answer) && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Model Answer
                      </p>
                      <div className="break-words text-sm leading-relaxed text-emerald-900">
                        <MarkdownRenderer
                          content={selectedQuestion.correctAnswer || selectedQuestion.answer}
                        />
                      </div>
                    </div>
                  )}

                  {selectedQuestion.explanation && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Explanation
                      </p>
                      <div className="break-words text-sm leading-relaxed text-slate-700">
                        <MarkdownRenderer content={selectedQuestion.explanation} />
                      </div>
                    </div>
                  )}

                  {selectedQuestion.sourcePages?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                        Source:
                      </span>
                      {selectedQuestion.sourcePages.map((p, i) => (
                        <span
                          key={i}
                          className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600"
                        >
                          Page {p}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-5">
                    <h3 className="mb-4 text-sm font-bold text-slate-800">
                      AI Tutor Chat History
                    </h3>

                    {loadingDiscussion && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                        Loading chat...
                      </div>
                    )}

                    {!loadingDiscussion && discussion?.messages?.length === 0 && (
                      <p className="text-sm italic text-slate-400">
                        No chat history for this question yet.
                      </p>
                    )}

                    {!loadingDiscussion && discussion?.messages?.length > 0 && (
                      <div className="space-y-4">
                        {discussion.messages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex flex-col ${
                              msg.role === "user" ? "items-end" : "items-start"
                            }`}
                          >
                            <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {msg.role === "user" ? "You" : "AI Tutor"}
                            </span>
                            <div
                              className={`max-w-[92%] break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[88%] ${
                                msg.role === "user"
                                  ? "bg-indigo-600 text-white"
                                  : "border border-slate-200 bg-slate-100 text-slate-800"
                              }`}
                            >
                              {msg.role === "user" ? (
                                msg.content
                              ) : (
                                <MarkdownRenderer content={msg.content} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
