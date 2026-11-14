import { useState } from "react";
import { Search, Copy, Check, Clock, User, Mic } from "lucide-react";

export default function LectureTranscriptViewer({ transcript = [], rawTranscript = "" }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredItems = (transcript || []).filter((item) =>
    (item.text || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    const fullText =
      rawTranscript ||
      (transcript || [])
        .map((t) => `[${t.timestamp || t.start || "00:00"}] ${t.speaker || "Instructor"}: ${t.text}`)
        .join("\n\n");

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Complete Lecture Transcript</h3>
          <p className="text-xs text-slate-500">
            Full spoken transcript preserved with precise timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search in transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none sm:w-64"
            />
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            title="Copy entire transcript"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Transcript Items */}
      <div className="max-h-[550px] flex-1 space-y-3 overflow-y-auto pr-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <Mic size={32} className="mb-2 text-slate-300" />
            <p className="text-sm font-semibold">
              {searchQuery ? "No transcript segments match your search." : "No transcript available."}
            </p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isStudent = (item.speaker || "").toLowerCase().includes("student");
            return (
              <div
                key={idx}
                className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/20"
              >
                {/* Timestamp Pill */}
                <span className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700 shadow-2xs">
                  <Clock size={12} />
                  <span>{item.timestamp || item.start || "00:00"}</span>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider ${
                        isStudent ? "text-amber-600" : "text-blue-600"
                      }`}
                    >
                      <User size={10} />
                      {item.speaker || "Teacher"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-800 sm:text-sm">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
