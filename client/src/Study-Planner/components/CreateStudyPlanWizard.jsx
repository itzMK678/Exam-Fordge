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
} from "lucide-react";

export default function CreateStudyPlanWizard({ onClose, onPlanCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStage, setLoadingStage] = useState(0);

  // Step 1: Exams
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [exams, setExams] = useState([
    {
      id: "exam-1",
      exam_name: "Mathematics Midterm",
      subject: "Mathematics",
      exam_date: tomorrow,
      test_type: "Midterm",
      syllabus: "Limits, Continuity, Differentiation, Applications of Derivatives",
      included_chapters: "Chapters 1 to 4",
      difficulty_level: "Medium",
      additional_instructions: "Focus heavily on application problems and proofs.",
    },
  ]);

  // Step 2: Materials
  const [files, setFiles] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Step 3: Preferences
  const [planTitle, setPlanTitle] = useState("Semester Exam Preparation Plan");
  const [description, setDescription] = useState("");
  const [dailyHours, setDailyHours] = useState(3.0);
  const [preferredDays, setPreferredDays] = useState([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]);

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Fetch existing documents from ExamForge
  useEffect(() => {
    async function fetchExisting() {
      setLoadingExisting(true);
      try {
        const res = await fetch("http://localhost:5000/api/history/documents", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setExistingDocs(json.data);
          }
        }
      } catch (err) {
        console.warn("Could not load existing documents:", err);
      } finally {
        setLoadingExisting(false);
      }
    }
    fetchExisting();
  }, []);

  const addExam = () => {
    setExams([
      ...exams,
      {
        id: `exam-${Date.now()}`,
        exam_name: "",
        subject: "",
        exam_date: tomorrow,
        test_type: "Midterm",
        syllabus: "",
        included_chapters: "",
        difficulty_level: "Medium",
        additional_instructions: "",
      },
    ]);
  };

  const removeExam = (index) => {
    if (exams.length <= 1) return;
    setExams(exams.filter((_, i) => i !== index));
  };

  const updateExam = (index, field, value) => {
    const updated = [...exams];
    updated[index] = { ...updated[index], [field]: value };
    setExams(updated);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const toggleExistingDoc = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const toggleDay = (day) => {
    setPreferredDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day]
    );
  };

  const validateStep1 = () => {
    for (const ex of exams) {
      if (!ex.exam_name.trim() || !ex.subject.trim() || !ex.exam_date || !ex.syllabus.trim()) {
        setError("Please complete all required fields (Exam Name, Subject, Date, Syllabus) for each exam.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (files.length === 0 && selectedDocIds.length === 0) {
      setError("Please upload at least one study document or select an existing document from your library.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setError(null);
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setLoadingStage(1);

    const stagesInterval = setInterval(() => {
      setLoadingStage((prev) => (prev < 4 ? prev + 1 : prev));
    }, 4000);

    try {
      const formData = new FormData();
      formData.append("title", planTitle);
      formData.append("description", description);
      formData.append("dailyStudyHours", String(dailyHours));
      formData.append("preferredDays", JSON.stringify(preferredDays));
      formData.append("exams", JSON.stringify(exams));
      formData.append("existingDocumentIds", JSON.stringify(selectedDocIds));

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("http://localhost:5000/api/study-planner", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const json = await res.json();
      clearInterval(stagesInterval);

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to generate study schedule.");
      }

      if (onPlanCreated) {
        onPlanCreated(json.data);
      }
    } catch (err) {
      clearInterval(stagesInterval);
      setError(err.message || "Failed to generate study plan.");
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Create AI Study Plan & Schedule
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                Multi-exam scheduling, document mapping, and intelligent pacing
              </p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Stepper Indicator */}
        {!loading && (
          <div className="my-5 flex items-center justify-between px-4 sm:px-12">
            {[
              { num: 1, label: "Exams & Syllabus" },
              { num: 2, label: "Study Materials" },
              { num: 3, label: "Pacing & Habits" },
            ].map((st) => (
              <div key={st.num} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
                    step === st.num
                      ? "bg-indigo-600 text-white shadow-sm"
                      : step > st.num
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step > st.num ? <CheckCircle2 size={16} /> : st.num}
                </div>
                <span
                  className={`hidden text-xs font-semibold sm:inline ${
                    step === st.num ? "text-indigo-900" : "text-slate-400"
                  }`}
                >
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
            <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Modal Body / Steps */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            /* Loading Generation Screen */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" />
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-lg" />
                <Sparkles className="absolute text-indigo-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                AI Architecting Your Study Timetable...
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md">
                Analyzing uploaded documents, matching syllabus topics, mapping chapter pages, and scheduling balanced daily workloads.
              </p>

              <div className="mt-8 w-full max-w-md space-y-3 text-left">
                {[
                  "Processing documents & extracting topic hierarchy",
                  "Analyzing exam dates & prerequisite dependencies",
                  "Matching syllabus against uploaded chapter pages",
                  "Distributing tasks & scheduling revision / mock tests",
                ].map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-xs transition ${
                      loadingStage > idx
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold"
                        : loadingStage === idx
                        ? "border-indigo-300 bg-indigo-50/70 text-indigo-900 font-bold animate-pulse"
                        : "border-slate-100 bg-slate-50 text-slate-400"
                    }`}
                  >
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        loadingStage > idx
                          ? "bg-emerald-500"
                          : loadingStage === idx
                          ? "bg-indigo-600 animate-ping"
                          : "bg-slate-300"
                      }`}
                    />
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: EXAMS & SYLLABUS */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Upcoming Exams & Test Series
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add all upcoming tests or midterms. AI will automatically balance topics across dates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addExam}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                >
                  <Plus size={15} />
                  <span>Add Another Exam</span>
                </button>
              </div>

              <div className="space-y-5">
                {exams.map((exam, idx) => (
                  <div
                    key={exam.id}
                    className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 transition hover:border-slate-300"
                  >
                    {exams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExam(idx)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 p-1"
                        title="Remove Exam"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">
                        {exam.exam_name || `Exam #${idx + 1}`}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Exam / Test Name *
                        </label>
                        <input
                          type="text"
                          value={exam.exam_name}
                          onChange={(e) => updateExam(idx, "exam_name", e.target.value)}
                          placeholder="e.g. Calculus Midterm 1"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Subject *
                        </label>
                        <input
                          type="text"
                          value={exam.subject}
                          onChange={(e) => updateExam(idx, "subject", e.target.value)}
                          placeholder="e.g. Mathematics"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Exam Date *
                        </label>
                        <input
                          type="date"
                          value={exam.exam_date}
                          min={tomorrow}
                          onChange={(e) => updateExam(idx, "exam_date", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Test Type
                        </label>
                        <select
                          value={exam.test_type}
                          onChange={(e) => updateExam(idx, "test_type", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                        >
                          <option value="Quiz">Quiz</option>
                          <option value="Class Test">Class Test</option>
                          <option value="Midterm">Midterm</option>
                          <option value="Final Exam">Final Exam</option>
                          <option value="Test Series">Test Series</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Difficulty Level
                        </label>
                        <select
                          value={exam.difficulty_level}
                          onChange={(e) => updateExam(idx, "difficulty_level", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                        >
                          <option value="Easy">Easy (Conceptual review)</option>
                          <option value="Medium">Medium (Balanced practice)</option>
                          <option value="Hard">Hard (In-depth proofs & problems)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Syllabus Topics & Subtopics *
                      </label>
                      <textarea
                        rows={2}
                        value={exam.syllabus}
                        onChange={(e) => updateExam(idx, "syllabus", e.target.value)}
                        placeholder="List covered topics, e.g. Limits, Continuity, Derivative Rules, Implicit Differentiation..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Included Chapters (Optional)
                        </label>
                        <input
                          type="text"
                          value={exam.included_chapters}
                          onChange={(e) => updateExam(idx, "included_chapters", e.target.value)}
                          placeholder="e.g. Chapters 1-4, Appendix B"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Additional Instructions (Optional)
                        </label>
                        <input
                          type="text"
                          value={exam.additional_instructions}
                          onChange={(e) => updateExam(idx, "additional_instructions", e.target.value)}
                          placeholder="e.g. Teacher emphasized past paper questions from 2024"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : step === 2 ? (
            /* STEP 2: STUDY MATERIALS */
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Upload & Select Study Materials
                </h3>
                <p className="text-xs text-slate-500">
                  Upload PDFs, DOCX notes, books, or select files previously saved in ExamForge. AI will extract pages and match them directly with your syllabus.
                </p>
              </div>

              {/* Upload Dropzone */}
              <label className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 p-6 text-center hover:bg-indigo-50/80 transition cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm mb-3">
                  <Upload size={22} />
                </div>
                <span className="text-sm font-bold text-slate-900">
                  Click to upload study documents
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  Supports multiple PDF & DOCX files (lecture notes, textbooks, past papers)
                </span>
              </label>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Newly Uploaded Files ({files.length})
                  </h4>
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText size={18} className="text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">
                            {file.name}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previously Uploaded Library Documents */}
              {existingDocs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Or Select from Existing ExamForge Documents ({existingDocs.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                    {existingDocs.map((doc) => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => toggleExistingDoc(doc.id)}
                          className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-100/70 border border-indigo-300 text-indigo-950 font-bold"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <BookOpen size={16} className={isSelected ? "text-indigo-600" : "text-slate-400"} />
                            <span className="truncate">{doc.filename}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 3: PACING & HABITS */
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Study Habits & Pacing Preferences
                </h3>
                <p className="text-xs text-slate-500">
                  Configure how much time you can study daily and which days you prefer. AI will realistically distribute tasks without cramming.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plan Title
                </label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock size={15} className="text-indigo-600" />
                    Available Daily Study Time
                  </label>
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
                    {dailyHours} Hours / Day
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1 hr (Light)</span>
                  <span>3 hrs (Standard)</span>
                  <span>5 hrs (Intensive)</span>
                  <span>8 hrs (Full-time)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Calendar size={15} className="text-indigo-600" />
                  Preferred Study Days
                </label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {allDays.map((day) => {
                    const isSelected = preferredDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-xl py-2 px-1 text-center text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Personal Goals or Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Aiming for an A grade in Calculus and solid understanding before Finals."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:opacity-95 transition shadow-md cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Generate Intelligent Study Schedule</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
