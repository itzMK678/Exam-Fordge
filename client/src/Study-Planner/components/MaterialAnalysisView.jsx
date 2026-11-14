import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  FileText,
} from "lucide-react";

export default function MaterialAnalysisView({ plan }) {
  const summary = plan?.analysis_summary || {};
  const mappings = plan?.mappings || [];
  const rationale = plan?.ai_rationale || "";

  const missingMappings = mappings.filter((m) => m.coverage_status === "missing");
  const coveredMappings = mappings.filter((m) => m.coverage_status === "covered");
  const partialMappings = mappings.filter((m) => m.coverage_status === "partial");
  const overlappingMappings = mappings.filter((m) => m.is_overlapping);

  const getComplexityBadge = (level) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "covered":
        return {
          icon: <CheckCircle2 size={14} className="text-emerald-600" />,
          label: "Covered in Materials",
          badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "partial":
        return {
          icon: <AlertTriangle size={14} className="text-amber-600" />,
          label: "Partially Covered",
          badge: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "missing":
        return {
          icon: <HelpCircle size={14} className="text-rose-600" />,
          label: "Missing from Uploads",
          badge: "bg-rose-50 text-rose-800 border-rose-200",
        };
      default:
        return {
          icon: null,
          label: status,
          badge: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Analysis Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Topics</span>
            <Layers size={16} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            {summary.total_topics || mappings.length}
          </p>
          <span className="text-[11px] font-medium text-slate-400">
            Identified from syllabus
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>Verified Covered</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950 sm:text-3xl">
            {coveredMappings.length}
          </p>
          <span className="text-[11px] font-medium text-emerald-700">
            With page citations
          </span>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800">
            <span>Missing Topics</span>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-950 sm:text-3xl">
            {missingMappings.length}
          </p>
          <span className="text-[11px] font-medium text-rose-700">
            Require supplementary notes
          </span>
        </div>

        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-800">
            <span>Overlapping Topics</span>
            <Sparkles size={16} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-950 sm:text-3xl">
            {overlappingMappings.length}
          </p>
          <span className="text-[11px] font-medium text-indigo-700">
            Common across multiple exams
          </span>
        </div>
      </div>

      {/* Missing Material Warning Banner (if any) */}
      {missingMappings.length > 0 && (
        <div className="flex items-start gap-3.5 rounded-3xl border border-rose-200 bg-rose-50/80 p-5 shadow-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-2xs">
            <AlertTriangle size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-rose-950">
              Missing Study Material Detected
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              The AI analysis did not locate relevant chapters or pages for the following syllabus topics in your uploaded documents. Please provide lecture slides or notes for:{" "}
              <span className="font-bold">
                {missingMappings.map((m) => m.topic).join(", ")}
              </span>
              .
            </p>
          </div>
        </div>
      )}

      {/* AI Pedagogical Preparation Order & Rationale */}
      {rationale && (
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-blue-50/40 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles size={14} />
            </div>
            <h3 className="text-sm font-extrabold text-indigo-950">
              AI Pedagogical Preparation Order & Strategic Rationale
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-indigo-900/90 leading-relaxed whitespace-pre-line">
            {rationale}
          </p>
        </div>
      )}

      {/* Material Mappings Detailed List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            Syllabus-to-Document Material Mapping
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Strict page and chapter references
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {mappings.map((item, idx) => {
            const statusInfo = getStatusBadge(item.coverage_status);
            return (
              <div
                key={item.id || idx}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-200 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: Subject, Topic, Subtopics */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-700">
                        {item.subject}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${statusInfo.badge}`}
                      >
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </span>
                      <span
                        className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold ${getComplexityBadge(
                          item.complexity
                        )}`}
                      >
                        {item.complexity} Complexity
                      </span>
                      {item.is_overlapping && (
                        <span className="rounded-lg bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[11px] font-bold">
                          Multi-Exam Overlap
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      {item.topic}
                    </h4>

                    {item.subtopics && item.subtopics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-semibold text-slate-600">Subtopics:</span>
                        {item.subtopics.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-xs text-slate-600 italic mt-1">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Right: Matched Document & Hours */}
                  <div className="flex flex-col items-start sm:items-end gap-1.5 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-1.5">
                      <FileText size={14} className="text-indigo-600" />
                      <span>{item.document_name || "No document matched"}</span>
                    </div>
                    {item.page_reference && (
                      <span className="text-xs font-semibold text-slate-600">
                        {item.page_reference}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-1">
                      <Clock size={12} />
                      <span>~{item.estimated_hours || 1.5} hrs estimated study</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
