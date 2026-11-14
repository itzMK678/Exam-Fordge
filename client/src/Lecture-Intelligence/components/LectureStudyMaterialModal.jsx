import { useState } from "react";
import {
  Sparkles,
  HelpCircle,
  FileCheck,
  Layers,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  RotateCw,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LectureStudyMaterialModal({
  lectureId,
  lectureTitle,
  onExamCreated,
}) {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);
  const [examSuccess, setExamSuccess] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [activeTab, setActiveTab] = useState("mcqs");
  const [error, setError] = useState("");

  const generateMaterial = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/lectures/${lectureId}/study-material`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ materialType: "all", count: 6 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate study materials.");

      setMaterial(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qIdx, opt) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: opt }));
  };

  const toggleFlip = (cardIdx) => {
    setFlippedCards((prev) => ({ ...prev, [cardIdx]: !prev[cardIdx] }));
  };

  const handleCreateExamSession = async () => {
    if (!material) return;
    setCreatingExam(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/lectures/${lectureId}/create-exam-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studyMaterial: material }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create exam session.");

      setExamSuccess(true);
      if (onExamCreated) {
        onExamCreated(data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingExam(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <Sparkles size={13} /> Active Recall & Study Material
          </span>
          <h3 className="mt-1 text-xl font-bold text-slate-900">
            Practice Materials & Exam Builder
          </h3>
          <p className="text-xs text-slate-500">
            Generate quizzes, conceptual flashcards, and full exam papers based on this lecture.
          </p>
        </div>

        {!material && (
          <button
            onClick={generateMaterial}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
            <span>{loading ? "Generating Study Pack..." : "Generate Study Pack"}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {!material && !loading && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-slate-500">
          <Layers size={36} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No Study Materials Generated Yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Click "Generate Study Pack" to extract practice questions, flashcards, and quick revision notes.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <Loader2 className="animate-spin text-indigo-600 mb-3" size={32} />
          <p className="text-sm font-semibold text-slate-700">Crafting study materials...</p>
          <p className="text-xs text-slate-400">
            Formulating MCQs, short answer tests, and active recall flashcards.
          </p>
        </div>
      )}

      {material && (
        <div className="space-y-6">
          {/* Sub Tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("mcqs")}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  activeTab === "mcqs"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                MCQs ({material.mcqs?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("flashcards")}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  activeTab === "flashcards"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Flashcards ({material.flashcards?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("shortQuestions")}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  activeTab === "shortQuestions"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Short Questions ({material.shortQuestions?.length || 0})
              </button>
            </div>

            <button
              onClick={handleCreateExamSession}
              disabled={creatingExam || examSuccess}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {examSuccess ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Exam Paper Saved to History!</span>
                </>
              ) : creatingExam ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FileCheck size={14} />
                  <span>Save as Exam Paper</span>
                </>
              )}
            </button>
          </div>

          {/* MCQs TAB */}
          {activeTab === "mcqs" && (
            <div className="space-y-4">
              {(material.mcqs || []).map((q, qIdx) => {
                const chosen = selectedAnswers[qIdx];
                return (
                  <div
                    key={qIdx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        Q{qIdx + 1}. {q.question}
                      </p>
                      {q.timestamp && (
                        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                          [{q.timestamp}]
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options?.map((opt, optIdx) => {
                        const isChosen = chosen === opt;
                        const isCorrect = opt === q.correctAnswer;
                        let btnStyle = "border-slate-200 bg-white text-slate-700 hover:border-indigo-300";

                        if (chosen) {
                          if (isCorrect) {
                            btnStyle = "border-emerald-400 bg-emerald-50 font-bold text-emerald-800";
                          } else if (isChosen) {
                            btnStyle = "border-rose-400 bg-rose-50 text-rose-800";
                          } else {
                            btnStyle = "border-slate-100 bg-white/50 text-slate-400 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={!!chosen}
                            onClick={() => handleSelectAnswer(qIdx, opt)}
                            className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs transition ${btnStyle}`}
                          >
                            <span>
                              <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                            </span>
                            {chosen && isCorrect && <CheckCircle2 size={14} className="text-emerald-600" />}
                            {chosen && isChosen && !isCorrect && <XCircle size={14} className="text-rose-600" />}
                          </button>
                        );
                      })}
                    </div>

                    {chosen && q.explanation && (
                      <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs leading-relaxed text-indigo-950">
                        <span className="font-bold">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* FLASHCARDS TAB */}
          {activeTab === "flashcards" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {(material.flashcards || []).map((card, cIdx) => {
                const isFlipped = !!flippedCards[cIdx];
                return (
                  <div
                    key={cIdx}
                    onClick={() => toggleFlip(cIdx)}
                    className="flex min-h-[160px] cursor-pointer flex-col justify-between rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-blue-50/40 p-5 shadow-2xs transition hover:scale-[1.01] hover:border-indigo-300"
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                        <span>{isFlipped ? "EXPLANATION / ANSWER" : "CONCEPT / TERM"}</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <RotateCw size={12} /> Click to flip
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed">
                        {isFlipped ? card.back : card.front}
                      </p>
                    </div>
                    {card.timestamp && (
                      <span className="mt-2 text-[10px] font-semibold text-slate-400">
                        Timestamp: [{card.timestamp}]
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SHORT QUESTIONS TAB */}
          {activeTab === "shortQuestions" && (
            <div className="space-y-4">
              {(material.shortQuestions || []).map((sq, sqIdx) => (
                <div key={sqIdx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    Q{sqIdx + 1}. {sq.question}
                  </h4>
                  <div className="mt-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-950">
                    <span className="font-bold text-emerald-800">Model Answer: </span>
                    {sq.modelAnswer}
                  </div>
                  {sq.keyConcepts && sq.keyConcepts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {sq.keyConcepts.map((kc, kIdx) => (
                        <span key={kIdx} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600">
                          {kc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
