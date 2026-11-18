import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  FileAudio,
  FileVideo,
  BookOpen,
  MessageSquare,
  FileText,
  Clock,
  Layers,
  Trash2,
  Plus,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  FileCheck,
} from "lucide-react";
import Navbar from "../Front-Page/components/Navbar";
import LectureUploadCard from "./components/LectureUploadCard";
import LectureTranscriptViewer from "./components/LectureTranscriptViewer";
import LectureTopicsPanel from "./components/LectureTopicsPanel";
import LectureConceptsPanel from "./components/LectureConceptsPanel";
import LectureNonAcademicPanel from "./components/LectureNonAcademicPanel";
import LectureNotesPanel from "./components/LectureNotesPanel";
import LectureChatbot from "./components/LectureChatbot";
import LectureStudyMaterialModal from "./components/LectureStudyMaterialModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DailyLecturePage({ hideNavbar = false }) {
  const navigate = useNavigate();
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState("notes"); // 'notes', 'topics', 'transcript', 'nonacademic', 'chat', 'study'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch all lectures
  const fetchLectures = async () => {
    try {
      const res = await fetch(`${API_URL}/api/lectures`, {
        credentials: "include",
      });
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load lectures.");

      const list = data.data || [];
      setLectures(list);

      // If nothing selected or selected lecture updated, pick first
      if (list.length > 0 && !selectedLecture) {
        fetchLectureDetail(list[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  // 2. Auto-poll if any lecture is still processing
  useEffect(() => {
    const hasProcessing = lectures.some((l) => l.status === "processing" || l.status === "uploading");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchLectures();
      if (selectedLecture && selectedLecture.status === "processing") {
        fetchLectureDetail(selectedLecture.id);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [lectures, selectedLecture]);

  // 3. Fetch single lecture detail
  const fetchLectureDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/api/lectures/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load lecture details.");
      setSelectedLecture(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 4. Delete lecture
  const handleDeleteLecture = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this lecture recording and all generated intelligence?")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/lectures/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete.");
      }

      setLectures((prev) => prev.filter((l) => l.id !== id));
      if (selectedLecture?.id === id) {
        setSelectedLecture(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLectureCreated = (newLecture) => {
    setShowUploadModal(false);
    setLectures((prev) => [newLecture, ...prev]);
    setSelectedLecture(newLecture);
    fetchLectureDetail(newLecture.id);
  };

  const tabs = [
    { id: "notes", label: "Notes & Summary", icon: FileText },
    { id: "topics", label: "Topics & Concepts", icon: BookOpen },
    { id: "transcript", label: "Full Transcript", icon: Clock },
    { id: "nonacademic", label: "Announcements & Deadlines", icon: Bell },
    { id: "chat", label: "AI Lecture Tutor", icon: MessageSquare },
    { id: "study", label: "Study Material & Exam", icon: FileCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {!hideNavbar && <Navbar />}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Top Header Banner */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                <Sparkles size={13} /> Daily Lecture
              </span>
              <span className="text-xs text-slate-400">· Lecture Intelligence Platform</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Turn Classroom Recordings into Mastered Knowledge
            </h1>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Upload class recordings to get full transcripts, extracted concepts, organized notes, and an AI tutor grounded in what the teacher taught.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 sm:text-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>Record / Upload Lecture</span>
            </button>
          </div>
        </div>

        {/* Upload Modal / Banner if open or no lectures exist */}
        {(showUploadModal || (!loadingList && lectures.length === 0)) && (
          <div className="mb-8">
            <LectureUploadCard onLectureCreated={handleLectureCreated} />
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* LEFT SIDEBAR: Lecture List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Lectures ({lectures.length})
              </h2>
            </div>

            {loadingList && (
              <div className="flex items-center justify-center py-12 text-xs text-slate-400">
                <Loader2 className="animate-spin mr-2" size={16} />
                Loading recordings...
              </div>
            )}

            {!loadingList && lectures.length === 0 && !showUploadModal && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
                No recordings yet. Click "Record / Upload Lecture" to begin!
              </div>
            )}

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {lectures.map((item) => {
                const isSelected = selectedLecture?.id === item.id;
                const isProcessing = item.status === "processing" || item.status === "uploading";
                const isFailed = item.status === "failed";

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedLecture(item);
                      fetchLectureDetail(item.id);
                    }}
                    className={`group relative flex cursor-pointer items-start justify-between rounded-2xl border p-3.5 transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                          isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.file_type?.includes("video") || item.filename?.endsWith(".mp4") ? (
                          <FileVideo size={14} />
                        ) : (
                          <FileAudio size={14} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                          {item.title || item.filename}
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>
                            {new Date(item.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>

                          {isProcessing && (
                            <span className="flex items-center gap-1 font-bold text-amber-600">
                              <Loader2 size={10} className="animate-spin" /> Analyzing...
                            </span>
                          )}

                          {isFailed && (
                            <span className="flex items-center gap-1 font-bold text-rose-600">
                              <AlertCircle size={10} /> Failed
                            </span>
                          )}

                          {!isProcessing && !isFailed && (
                            <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                              <CheckCircle2 size={10} /> Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteLecture(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition p-1"
                      title="Delete recording"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT MAIN AREA: Lecture Intelligence Dashboard */}
          <div className="lg:col-span-3">
            {!selectedLecture ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 text-center text-slate-400">
                <FileAudio size={48} className="mb-3 text-slate-300" />
                <h3 className="text-base font-bold text-slate-700">Select a Lecture Recording</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  Choose an existing lecture from the left or upload a new recording to explore its AI intelligence.
                </p>
              </div>
            ) : selectedLecture.status === "processing" ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-amber-200 bg-amber-50/40 p-16 text-center">
                <Loader2 size={40} className="animate-spin text-amber-600 mb-4" />
                <h3 className="text-lg font-bold text-amber-950">
                  Processing "{selectedLecture.title}"
                </h3>
                <p className="mt-2 max-w-md text-xs text-amber-800 leading-relaxed">
                  Our system is transcribing every spoken word, isolating casual chatter and deadlines from syllabus content, and extracting key formulas and definitions.
                </p>
                <span className="mt-4 text-[11px] font-semibold text-amber-600 animate-pulse">
                  This page will automatically update once analysis is complete...
                </span>
              </div>
            ) : selectedLecture.status === "failed" ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
                <AlertCircle size={36} className="mx-auto mb-2 text-rose-500" />
                <h3 className="text-base font-bold">Lecture Processing Failed</h3>
                <p className="mt-1 text-xs text-rose-600">
                  {selectedLecture.error_message || "We could not extract clear audio from this recording."}
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Try Uploading Again
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Lecture Header Bar */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                        Active Session
                      </span>
                      <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                        {selectedLecture.title}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Filename: {selectedLecture.filename} ·{" "}
                        {selectedLecture.file_size
                          ? `${(selectedLecture.file_size / (1024 * 1024)).toFixed(1)} MB`
                          : "Audio"}{" "}
                        ·{" "}
                        {new Date(selectedLecture.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to="/work"
                        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        title="Use in Exam Generator"
                      >
                        <Sparkles size={14} />
                        <span>Generate Exam From Lecture</span>
                      </Link>
                    </div>
                  </div>

                  {/* Feature Navigation Tabs */}
                  <div className="mt-5 flex gap-1 overflow-x-auto border-t border-slate-100 pt-3">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Icon size={14} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TAB CONTENT PANELS */}
                {activeTab === "notes" && (
                  <LectureNotesPanel
                    title={selectedLecture.title}
                    summary={selectedLecture.summary}
                    organizedNotes={selectedLecture.organized_notes}
                  />
                )}

                {activeTab === "topics" && (
                  <div className="space-y-6">
                    <LectureTopicsPanel topics={selectedLecture.topics || []} />
                    <LectureConceptsPanel
                      definitions={selectedLecture.definitions || []}
                      examples={selectedLecture.examples || []}
                      formulasAndConcepts={selectedLecture.formulas_and_concepts || []}
                      questionsDiscussed={selectedLecture.questions_discussed || []}
                    />
                  </div>
                )}

                {activeTab === "transcript" && (
                  <LectureTranscriptViewer
                    transcript={selectedLecture.transcript || []}
                    rawTranscript={selectedLecture.raw_transcript}
                  />
                )}

                {activeTab === "nonacademic" && (
                  <LectureNonAcademicPanel
                    nonAcademic={selectedLecture.non_academic || []}
                  />
                )}

                {activeTab === "chat" && (
                  <LectureChatbot
                    lectureId={selectedLecture.id}
                    lectureTitle={selectedLecture.title}
                  />
                )}

                {activeTab === "study" && (
                  <LectureStudyMaterialModal
                    lectureId={selectedLecture.id}
                    lectureTitle={selectedLecture.title}
                    onExamCreated={(exam) => {
                      alert("Exam session successfully created and saved to your Exam History!");
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
