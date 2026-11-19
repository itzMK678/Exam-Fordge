import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Edit2,
  Layers,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CreateStudyPlanWizard({ onClose, onPlanCreated }) {
  // 5 Guided Steps:
  // 1: Study Materials (Select or Upload)
  // 2: Topic Identification (AI Document Analysis & Edit)
  // 3: Manual Topic Entry (Add custom topics or combine)
  // 4: Exam Information (Days remaining, daily hours, difficulty)
  // 5: Review & Generate
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [analyzingDocs, setAnalyzingDocs] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStage, setLoadingStage] = useState(0);

  // STEP 1 STATE: Materials
  const [existingDocs, setExistingDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // STEP 2 & 3 STATE: Topics
  // Structure: [{ id, name, subtopics: [], documentName, documentId, isManual, isSelected: true, priority: 'Medium' }]
  const [detectedTopics, setDetectedTopics] = useState([]);
  const [manualTopicInput, setManualTopicInput] = useState("");
  const [manualSubtopicsInput, setManualSubtopicsInput] = useState("");
  const [manualPriority, setManualPriority] = useState("Medium");
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingTopicName, setEditingTopicName] = useState("");
  const [newSubtopicInput, setNewSubtopicInput] = useState({});

  // STEP 4 STATE: Exam Info
  const [subject, setSubject] = useState("Database Systems");
  const [planTitle, setPlanTitle] = useState("Database Systems – Exam Preparation Plan");
  const [daysRemaining, setDaysRemaining] = useState(7);
  const [dailyHours, setDailyHours] = useState(2.5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [useExactDate, setUseExactDate] = useState(false);

  const defaultExamDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const [examDate, setExamDate] = useState(defaultExamDate);

  // Fetch user's existing documents from library
  useEffect(() => {
    async function fetchDocs() {
      setLoadingExisting(true);
      try {
        const res = await fetch(`${API_URL}/api/history/documents`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setExistingDocs(json.data);
          }
        }
      } catch (err) {
        console.warn("Could not load documents:", err);
      } finally {
        setLoadingExisting(false);
      }
    }
    fetchDocs();
  }, []);

  // Update plan title when subject changes
  const handleSubjectChange = (val) => {
    setSubject(val);
    setPlanTitle(`${val} – Exam Preparation Plan`);
  };

  // -------------------------------------------------------------
  // STEP 1: Handle File Selection & Upload
  // -------------------------------------------------------------
  const toggleDocSelection = (id) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer?.files || []);
    const valid = dropped.filter((f) => f.name.endsWith(".pdf") || f.name.endsWith(".docx"));
    setUploadedFiles((prev) => [...prev, ...valid]);
  };

  const handleFileInput = (e) => {
    const chosen = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...chosen]);
  };

  const removeUploadedFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Proceed to Step 2: Extract topics with AI
  const handleAnalyzeMaterials = async () => {
    setError(null);

    // If no files selected or uploaded, allow user to jump straight to manual topics!
    if (selectedDocIds.length === 0 && uploadedFiles.length === 0) {
      setStep(3);
      return;
    }

    setAnalyzingDocs(true);
    try {
      const formData = new FormData();
      formData.append("documentIds", JSON.stringify(selectedDocIds));
      for (const file of uploadedFiles) {
        formData.append("files", file);
      }

      const res = await fetch(`${API_URL}/api/study-planner/analyze-topics`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to analyze study materials.");

      const extractedDocs = json.data?.documents || [];
      const extractedTopicsList = [];

      extractedDocs.forEach((doc) => {
        (doc.topics || []).forEach((t, idx) => {
          extractedTopicsList.push({
            id: `topic-${doc.documentId || doc.filename}-${idx}-${Date.now()}`,
            name: t.name,
            subtopics: t.subtopics || [],
            documentName: doc.filename,
            documentId: doc.documentId,
            isManual: false,
            isSelected: true,
            priority: "Medium",
          });
        });
      });

      setDetectedTopics(extractedTopicsList);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzingDocs(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2: Topic Review & Editing
  // -------------------------------------------------------------
  const toggleTopicSelection = (topicId) => {
    setDetectedTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, isSelected: !t.isSelected } : t))
    );
  };

  const deleteTopic = (topicId) => {
    setDetectedTopics((prev) => prev.filter((t) => t.id !== topicId));
  };

  const startEditTopic = (topic) => {
    setEditingTopicId(topic.id);
    setEditingTopicName(topic.name);
  };

  const saveEditTopic = (topicId) => {
    if (editingTopicName.trim()) {
      setDetectedTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, name: editingTopicName.trim() } : t))
      );
    }
    setEditingTopicId(null);
  };

  const addSubtopicToTopic = (topicId) => {
    const text = (newSubtopicInput[topicId] || "").trim();
    if (!text) return;
    setDetectedTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, subtopics: [...(t.subtopics || []), text] } : t
      )
    );
    setNewSubtopicInput((prev) => ({ ...prev, [topicId]: "" }));
  };

  const removeSubtopicFromTopic = (topicId, subIndex) => {
    setDetectedTopics((prev) =>
      prev.map((t) =>
        t.id === topicId
          ? { ...t, subtopics: t.subtopics.filter((_, idx) => idx !== subIndex) }
          : t
      )
    );
  };

  // -------------------------------------------------------------
  // STEP 3: Manual Topic Entry
  // -------------------------------------------------------------
  const handleAddManualTopic = (e) => {
    if (e) e.preventDefault();
    if (!manualTopicInput.trim()) return;

    const subtopics = manualSubtopicsInput
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newTopic = {
      id: `manual-topic-${Date.now()}`,
      name: manualTopicInput.trim(),
      subtopics,
      documentName: "Manually Added",
      documentId: null,
      isManual: true,
      isSelected: true,
      priority: manualPriority,
    };

    setDetectedTopics((prev) => [...prev, newTopic]);
    setManualTopicInput("");
    setManualSubtopicsInput("");
  };

  // Active confirmed topics (selected ones only)
  const activeConfirmedTopics = detectedTopics.filter((t) => t.isSelected);

  // -------------------------------------------------------------
  // STEP 5: Submit Final Schedule Generation
  // -------------------------------------------------------------
  const handleGenerateSchedule = async () => {
    if (activeConfirmedTopics.length === 0) {
      setError("Please select or add at least one topic to schedule.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStage(1);

    const stageTimer1 = setTimeout(() => setLoadingStage(2), 2500);
    const stageTimer2 = setTimeout(() => setLoadingStage(3), 5000);

    try {
      const calculatedDate = useExactDate
        ? examDate
        : new Date(Date.now() + Number(daysRemaining) * 86400000).toISOString().split("T")[0];

      const formData = new FormData();
      formData.append("title", planTitle);
      formData.append("subject", subject);
      formData.append("daysRemaining", String(daysRemaining));
      formData.append("examDate", calculatedDate);
      formData.append("dailyStudyHours", String(dailyHours));
      formData.append("topics", JSON.stringify(activeConfirmedTopics));
      formData.append("existingDocumentIds", JSON.stringify(selectedDocIds));

      for (const file of uploadedFiles) {
        formData.append("files", file);
      }

      const res = await fetch(`${API_URL}/api/study-planner`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to generate study schedule.");

      onPlanCreated(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setLoading(false);
      setLoadingStage(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          disabled={loading || analyzingDocs}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-30 cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* =========================================================
            STEPPER PROGRESS HEADER
        ========================================================= */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles size={16} />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
              Smart Study Schedule Generator
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {step === 1 && "Step 1: Select or Upload Study Materials"}
            {step === 2 && "Step 2: AI Topic Identification & Review"}
            {step === 3 && "Step 3: Add Custom / Manual Topics"}
            {step === 4 && "Step 4: Exam Timeline & Daily Study Hours"}
            {step === 5 && "Step 5: Review & Generate Day-by-Day Roadmap"}
          </h2>

          {/* Stepper Dots & Labels */}
          <div className="mt-4 flex items-center justify-between gap-1 text-[11px] font-bold text-slate-500">
            {[
              { num: 1, label: "Materials" },
              { num: 2, label: "AI Topics" },
              { num: 3, label: "Manual Topics" },
              { num: 4, label: "Timeline" },
              { num: 5, label: "Generate" },
            ].map((s) => (
              <div
                key={s.num}
                onClick={() => !loading && !analyzingDocs && s.num < step && setStep(s.num)}
                className={`flex items-center gap-1.5 transition ${
                  step === s.num
                    ? "text-indigo-600 font-extrabold"
                    : step > s.num
                    ? "text-emerald-600 cursor-pointer"
                    : "text-slate-400"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    step === s.num
                      ? "bg-indigo-600 text-white"
                      : step > s.num
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Notice</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              ✕
            </button>
          </div>
        )}

        {/* =========================================================
            STEP 1: SELECT OR UPLOAD MATERIALS
        ========================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Select existing PDFs from your library or upload new textbook chapters. The AI will extract their text, identify all topics, and connect each day's study plan to the relevant document.
            </p>

            {/* Dropzone for New Files */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 sm:p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/20"
            >
              <input
                type="file"
                multiple
                accept=".pdf,.docx"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={32} className="mx-auto mb-2 text-indigo-600" />
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Drag & drop PDFs or click to browse files
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports PDF, DOCX (textbooks, lecture notes, syllabus guides)
              </p>
            </div>

            {/* Uploaded Files Queue */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  New Files to Upload ({uploadedFiles.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-900 font-medium"
                    >
                      <FileText size={14} className="text-indigo-600" />
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeUploadedFile(idx)}
                        className="text-indigo-400 hover:text-rose-600 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Library Documents */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Or select from your ExamForge Library ({existingDocs.length} files available):
                </span>
              </div>

              {loadingExisting ? (
                <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                  <Loader2 size={16} className="animate-spin mr-2" /> Loading document library...
                </div>
              ) : existingDocs.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
                  No documents in library yet. Upload a PDF above, or proceed directly to manual topic entry.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {existingDocs.map((doc) => {
                    const isChecked = selectedDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => toggleDocSelection(doc.id)}
                        className={`flex items-center justify-between rounded-xl border p-3 text-xs transition cursor-pointer ${
                          isChecked
                            ? "border-indigo-600 bg-indigo-50/40 text-indigo-950 font-bold"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <FileText size={16} className={isChecked ? "text-indigo-600" : "text-slate-400"} />
                          <span className="truncate max-w-[320px]">{doc.filename}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {doc.page_count ? `${doc.page_count} pages` : "PDF"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions for Step 1 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
              >
                No PDF? Skip straight to Manual Topics →
              </button>

              <button
                type="button"
                onClick={handleAnalyzeMaterials}
                disabled={analyzingDocs}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
              >
                {analyzingDocs ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Analyzing Documents with AI...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Topics with AI</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2: TOPIC IDENTIFICATION & REVIEW
        ========================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  The AI extracted the following topics from your study materials. Select, edit, or delete topics to refine your syllabus.
                </p>
                <span className="mt-1 inline-block text-[11px] font-bold text-indigo-600">
                  {detectedTopics.filter((t) => t.isSelected).length} of {detectedTopics.length} topics selected for scheduling
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Add More Topics</span>
              </button>
            </div>

            {/* Topic List Grouped */}
            <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
              {detectedTopics.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                  No topics were detected. Click "Add More Topics" to enter your topics manually.
                </div>
              ) : (
                detectedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className={`rounded-2xl border p-4 transition ${
                      topic.isSelected
                        ? "border-indigo-200 bg-indigo-50/30"
                        : "border-slate-200 bg-slate-50/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={topic.isSelected}
                          onChange={() => toggleTopicSelection(topic.id)}
                          className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />

                        <div className="min-w-0 flex-1">
                          {editingTopicId === topic.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingTopicName}
                                onChange={(e) => setEditingTopicName(e.target.value)}
                                className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                              />
                              <button
                                type="button"
                                onClick={() => saveEditTopic(topic.id)}
                                className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-bold text-white"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {topic.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => startEditTopic(topic)}
                                className="text-slate-400 hover:text-slate-600 transition"
                                title="Edit topic name"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          )}

                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Source Document: <strong className="text-slate-600">{topic.documentName}</strong>
                          </span>

                          {/* Subtopics Chips */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {(topic.subtopics || []).map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700"
                              >
                                <span>{sub}</span>
                                <button
                                  type="button"
                                  onClick={() => removeSubtopicFromTopic(topic.id, sIdx)}
                                  className="text-slate-300 hover:text-rose-500"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}

                            {/* Add Subtopic inline */}
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="+ subtopic"
                                value={newSubtopicInput[topic.id] || ""}
                                onChange={(e) =>
                                  setNewSubtopicInput({ ...newSubtopicInput, [topic.id]: e.target.value })
                                }
                                onKeyDown={(e) => e.key === "Enter" && addSubtopicToTopic(topic.id)}
                                className="w-20 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] outline-none focus:border-indigo-400"
                              />
                              <button
                                type="button"
                                onClick={() => addSubtopicToTopic(topic.id)}
                                className="text-[10px] text-indigo-600 font-bold hover:underline"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delete topic button */}
                      <button
                        type="button"
                        onClick={() => deleteTopic(topic.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 transition"
                        title="Delete topic"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions for Step 2 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={activeConfirmedTopics.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
              >
                <span>Continue to Timeline</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3: MANUAL TOPIC ENTRY & COMBINING
        ========================================================= */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Enter topics manually if you don't have a PDF, or add extra topics to combine with your AI-detected syllabus.
            </p>

            {/* Manual Entry Form */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Topic Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Normalization & Functional Dependencies"
                  value={manualTopicInput}
                  onChange={(e) => setManualTopicInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Subtopics (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1NF, 2NF, 3NF, BCNF"
                    value={manualSubtopicsInput}
                    onChange={(e) => setManualSubtopicsInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Priority / Complexity
                  </label>
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Low">Low Difficulty</option>
                    <option value="Medium">Medium Difficulty</option>
                    <option value="High">High Complexity (Requires extra time)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddManualTopic}
                disabled={!manualTopicInput.trim()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-40 cursor-pointer"
              >
                <Plus size={15} />
                <span>Add This Topic</span>
              </button>
            </div>

            {/* List of current topics */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Total Active Topics for Scheduling ({activeConfirmedTopics.length}):
              </span>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {activeConfirmedTopics.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{t.name}</span>
                      <span className="text-[10px] text-slate-400">
                        Source: {t.documentName} · {t.priority}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTopic(t.id)}
                      className="text-slate-300 hover:text-rose-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions for Step 3 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(detectedTopics.length > 0 ? 2 : 1)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={activeConfirmedTopics.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
              >
                <span>Continue to Timeline</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 4: EXAM TIMELINE & PREFERENCES
        ========================================================= */}
        {step === 4 && (
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Specify your subject name, how many days you have until the test, and your available daily study hours.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Subject / Course Name *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  placeholder="e.g. Database Systems, Physics, Calculus"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Timeline Mode: Days Remaining vs Exact Date */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Exam Timeline
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setUseExactDate(false)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        !useExactDate ? "bg-indigo-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      Days Remaining
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseExactDate(true)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        useExactDate ? "bg-indigo-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      Exact Calendar Date
                    </button>
                  </div>
                </div>

                {!useExactDate ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      How many days left until your exam?
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={daysRemaining}
                        onChange={(e) => setDaysRemaining(Math.max(1, Number(e.target.value)))}
                        className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-black text-indigo-600 outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-600">
                        Days remaining (Schedule runs Day 1 through Day {daysRemaining})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Daily Available Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Daily Available Study Time (Hours)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(Math.max(0.5, Number(e.target.value)))}
                      className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-bold text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-500">hours/day</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Overall Target Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Easy">Easy (Focus on core fundamentals)</option>
                    <option value="Medium">Medium (Balanced theory & problem-solving)</option>
                    <option value="Hard">Hard (Deep analysis & comprehensive proofs)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions for Step 4 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(5)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
              >
                <span>Review Schedule Setup</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 5: REVIEW & GENERATE
        ========================================================= */}
        {step === 5 && (
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Review your study configuration. The AI will distribute these topics across your available days, connecting every scheduled day to its source PDF and reserving time for revision and self-assessment.
            </p>

            {/* Summary Review Card */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <span className="text-xs font-bold text-indigo-950">
                  {planTitle}
                </span>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black text-indigo-700 uppercase">
                  {difficulty} Difficulty
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-xl bg-white p-3 border border-indigo-100/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Timeline</span>
                  <span className="text-base font-black text-indigo-700">
                    {useExactDate ? examDate : `${daysRemaining} Days`}
                  </span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-indigo-100/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Daily Goal</span>
                  <span className="text-base font-black text-indigo-700">{dailyHours}h / day</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-indigo-100/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Topics</span>
                  <span className="text-base font-black text-indigo-700">{activeConfirmedTopics.length}</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-indigo-100/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Materials</span>
                  <span className="text-base font-black text-indigo-700">
                    {selectedDocIds.length + uploadedFiles.length} PDFs
                  </span>
                </div>
              </div>

              {/* Topics breakdown preview */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                  Included Topics Breakdown:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {activeConfirmedTopics.map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1 text-xs text-slate-700 border border-indigo-100/40"
                    >
                      <span className="font-semibold truncate max-w-[280px]">
                        {idx + 1}. {t.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {t.documentName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading Indicator when generating */}
            {loading && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 text-center space-y-3">
                <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
                <h4 className="text-sm font-bold text-indigo-950">
                  {loadingStage === 1 && "Synthesizing topic relationships and prerequisites..."}
                  {loadingStage === 2 && "Connecting topics with PDF documents & page references..."}
                  {loadingStage === 3 && "Distributing workloads evenly across Day 1 to Day " + daysRemaining + "..."}
                </h4>
                <p className="text-[11px] text-indigo-700/80">
                  Gemini is optimizing your schedule to ensure manageable daily study and maximum retention.
                </p>
              </div>
            )}

            {/* Actions for Step 5 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateSchedule}
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Generate My Smart Study Schedule</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
