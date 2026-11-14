import { BookOpen, Layers, CheckCircle2 } from "lucide-react";

export default function LectureTopicsPanel({ topics = [] }) {
  if (!topics || topics.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        <BookOpen size={32} className="mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-semibold">No topics extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Lecture Syllabus & Topics</h3>
          <p className="text-xs text-slate-500">
            Main topics and structured subtopics taught during the session.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {topics.length} {topics.length === 1 ? "Topic" : "Topics"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {topics.map((t, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-sm"
          >
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-xs font-extrabold text-blue-700">
                  {idx + 1}
                </span>
                <h4 className="font-bold text-slate-900">{t.topic}</h4>
              </div>

              {t.summary && (
                <p className="mb-3 text-xs leading-relaxed text-slate-600">
                  {t.summary}
                </p>
              )}

              {t.subtopics && t.subtopics.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Subtopics Covered
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {t.subtopics.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        <CheckCircle2 size={12} className="text-blue-500" />
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
