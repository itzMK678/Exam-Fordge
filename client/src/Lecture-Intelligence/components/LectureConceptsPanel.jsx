import { useState } from "react";
import {
  FileCode2,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Clock,
  ChevronRight,
  BookMarked,
} from "lucide-react";

export default function LectureConceptsPanel({
  definitions = [],
  examples = [],
  formulasAndConcepts = [],
  questionsDiscussed = [],
}) {
  const [activeTab, setActiveTab] = useState("definitions");

  const tabs = [
    { id: "definitions", label: "Definitions", count: definitions.length, icon: BookMarked },
    { id: "examples", label: "Teacher Examples", count: examples.length, icon: Lightbulb },
    { id: "formulas", label: "Formulas & Concepts", count: formulasAndConcepts.length, icon: FileCode2 },
    { id: "questions", label: "Questions Discussed", count: questionsDiscussed.length, icon: HelpCircle },
  ];

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* DEFINITIONS TAB */}
      {activeTab === "definitions" && (
        <div className="space-y-3">
          {definitions.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No formal definitions extracted in this lecture.
            </p>
          ) : (
            definitions.map((def, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-blue-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{def.term}</h4>
                  {def.timestamp && (
                    <span className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-blue-600">
                      <Clock size={10} />
                      {def.timestamp}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                  {def.definition}
                </p>
                {def.context && (
                  <p className="mt-2 text-[11px] italic text-slate-500">
                    Context: {def.context}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* EXAMPLES TAB */}
      {activeTab === "examples" && (
        <div className="space-y-3">
          {examples.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No specific teacher examples extracted in this lecture.
            </p>
          ) : (
            examples.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 transition hover:border-amber-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Concept: {item.concept}
                  </span>
                  {item.timestamp && (
                    <span className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <Clock size={10} />
                      {item.timestamp}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-800 sm:text-sm">
                  {item.example}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* FORMULAS & CONCEPTS TAB */}
      {activeTab === "formulas" && (
        <div className="space-y-3">
          {formulasAndConcepts.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No formulas or theorem concepts extracted.
            </p>
          ) : (
            formulasAndConcepts.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 transition hover:border-indigo-200"
              >
                <h4 className="text-sm font-bold text-indigo-950">{item.concept}</h4>
                {item.formula && item.formula !== "N/A" && (
                  <div className="my-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 font-mono text-xs font-bold text-indigo-700">
                    {item.formula}
                  </div>
                )}
                {item.explanation && (
                  <p className="text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {item.explanation}
                  </p>
                )}
                {item.key_points && item.key_points.length > 0 && (
                  <ul className="mt-2.5 list-disc space-y-1 pl-4 text-xs text-slate-600">
                    {item.key_points.map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* QUESTIONS DISCUSSED TAB */}
      {activeTab === "questions" && (
        <div className="space-y-3">
          {questionsDiscussed.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No student/teacher questions discussed in this lecture.
            </p>
          ) : (
            questionsDiscussed.map((q, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-100 text-[10px] font-black text-blue-700">
                      Q
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 sm:text-sm">
                      {q.question}
                    </h4>
                  </div>
                  {q.timestamp && (
                    <span className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      <Clock size={10} />
                      {q.timestamp}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs leading-relaxed text-emerald-950 sm:text-sm">
                  <span className="font-bold text-emerald-800">Discussion / Answer: </span>
                  {q.answer_or_discussion}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
