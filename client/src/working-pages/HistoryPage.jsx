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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ---- Topbar ---- */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/work")}
            className=" p-3 bg-indigo-600 text-sm font-semibold text-white rounded-lg hover:bg-red-600 transition"
          >
             Back to Generator
          </button>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-black text-slate-900">My Exam History</h1>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)] overflow-hidden">
        {/* ================================================================
            LEFT PANEL — Exam List
        ================================================================ */}
        <aside className="w-80 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Saved Exams ({exams.length})
            </p>
          </div>

          {loadingExams && (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              Loading...
            </div>
          )}

          {examsError && (
            <div className="p-4 text-sm text-red-600 bg-red-50 m-3 rounded-xl border border-red-200">
              {examsError}
            </div>
          )}

          {!loadingExams && exams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm font-semibold text-slate-700">No saved exams yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Generate an exam and it will appear here.
              </p>
              <button
                onClick={() => navigate("/work")}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
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
                className={`cursor-pointer px-4 py-3.5 transition hover:bg-indigo-50/50 ${
                  selectedExam?.id === exam.id ? "bg-indigo-50 border-l-4 border-indigo-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 leading-snug">
                      {exam.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {exam.total_questions} questions · {exam.difficulty}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-300">
                      {formatDate(exam.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteExam(exam.id, e)}
                    disabled={deletingExamId === exam.id}
                    className="shrink-0 mt-0.5 text-slate-300 hover:text-red-500 transition text-xs"
                    title="Delete exam"
                  >
                    {deletingExamId === exam.id ? "…" : "🗑"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ================================================================
            CENTER PANEL — Questions List
        ================================================================ */}
        <div className="w-80 shrink-0 border-r border-slate-200 bg-slate-50/60 overflow-y-auto">
          {!selectedExam && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="text-4xl mb-3">👈</div>
              <p className="text-sm text-slate-400">Select an exam to view its questions</p>
            </div>
          )}

          {selectedExam && loadingDetail && (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              Loading questions...
            </div>
          )}

          {selectedExam && examDetail && (
            <>
              <div className="px-4 py-3 border-b border-slate-200 bg-white sticky top-0">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 truncate">
                  {examDetail.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {examDetail.questions?.length} questions
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {(examDetail.questions || []).map((q, idx) => (
                  <div
                    key={q.uid || q.id || idx}
                    onClick={() => selectQuestion(q)}
                    className={`cursor-pointer px-4 py-3 transition hover:bg-white ${
                      selectedQuestion?.uid === q.uid ? "bg-white border-l-4 border-indigo-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`shrink-0 mt-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                          typeBadge[q.type] || "bg-slate-50 text-slate-500 border-slate-100"
                        }`}
                      >
                        {typeLabel[q.type] || q.type}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                        Q{idx + 1}. {q.question}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ================================================================
            RIGHT PANEL — Question Detail + Chat History
        ================================================================ */}
        <div className="flex-1 overflow-y-auto bg-white">
          {!selectedQuestion && (
            <div className="flex flex-col items-center justify-center h-full text-center px-10">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm text-slate-400">
                Select a question to view the answer and AI tutor chat history
              </p>
            </div>
          )}

          {selectedQuestion && (
            <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
              {/* Question text */}
              <div>
                <span
                  className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold mb-2 ${
                    typeBadge[selectedQuestion.type] || "bg-slate-50 text-slate-500 border-slate-100"
                  }`}
                >
                  {typeLabel[selectedQuestion.type] || selectedQuestion.type}
                </span>
                <p className="text-base font-semibold text-slate-900 leading-relaxed">
                  {selectedQuestion.question}
                </p>
              </div>

              {/* MCQ Options */}
              {selectedQuestion.type === "mcq" && selectedQuestion.options?.length > 0 && (
                <div className="space-y-2">
                  {selectedQuestion.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border px-4 py-2.5 text-sm ${
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

              {/* Answer */}
              {(selectedQuestion.correctAnswer || selectedQuestion.answer) && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                    Model Answer
                  </p>
                  <div className="text-sm text-emerald-900">
                    <MarkdownRenderer
                      content={selectedQuestion.correctAnswer || selectedQuestion.answer}
                    />
                  </div>
                </div>
              )}

              {/* Explanation */}
              {selectedQuestion.explanation && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Explanation
                  </p>
                  <div className="text-sm text-slate-700">
                    <MarkdownRenderer content={selectedQuestion.explanation} />
                  </div>
                </div>
              )}

              {/* Source Pages */}
              {selectedQuestion.sourcePages?.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    Source:
                  </span>
                  {selectedQuestion.sourcePages.map((p, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-600"
                    >
                      Page {p}
                    </span>
                  ))}
                </div>
              )}

              {/* ---- Chat History ---- */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4">AI Tutor Chat History</h3>

                {loadingDiscussion && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    Loading chat...
                  </div>
                )}

                {!loadingDiscussion && discussion?.messages?.length === 0 && (
                  <p className="text-sm text-slate-400 italic">
                    No chat history for this question yet.
                  </p>
                )}

                {!loadingDiscussion && discussion?.messages?.length > 0 && (
                  <div className="space-y-3">
                    {discussion.messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <span className="mb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {msg.role === "user" ? "You" : "AI Tutor"}
                        </span>
                        <div
                          className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
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
        </div>
      </div>
    </div>
  );
}
