import { useState } from "react";
import { FileText, Copy, Check, Printer, Sparkles } from "lucide-react";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export default function LectureNotesPanel({
  title = "Lecture Notes",
  summary = "",
  organizedNotes = "",
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `# ${title}\n\n## Lecture Summary\n${summary}\n\n## Comprehensive Notes\n${organizedNotes}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      {summary && (
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-6 shadow-xs">
          <div className="mb-2 flex items-center gap-2 text-blue-800">
            <Sparkles size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Lecture Summary
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-800 sm:text-base">
            {summary}
          </p>
        </div>
      )}

      {/* Main Structured Notes Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              ExamForge · Lecture Intelligence
            </span>
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy Notes"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Markdown Notes Content */}
        {organizedNotes ? (
          <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800 sm:text-base">
            <MarkdownRenderer content={organizedNotes} />
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <FileText size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">Organized notes are not available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
