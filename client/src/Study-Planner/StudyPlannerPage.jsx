import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Front-Page/components/Navbar";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Plus,
  RefreshCw,
  MessageSquare,
  BarChart3,
  Layers,
  Flag,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
} from "lucide-react";

import CreateStudyPlanWizard from "./components/CreateStudyPlanWizard";
import DailyScheduleView from "./components/DailyScheduleView";
import CalendarScheduleView from "./components/CalendarScheduleView";
import WeeklyScheduleView from "./components/WeeklyScheduleView";
import MaterialAnalysisView from "./components/MaterialAnalysisView";
import SubjectProgressView from "./components/SubjectProgressView";
import TimelineScheduleView from "./components/TimelineScheduleView";
import StudyAnalyticsView from "./components/StudyAnalyticsView";
import RescheduleModal from "./components/RescheduleModal";
import StudyAssistantChat from "./components/StudyAssistantChat";

export default function StudyPlannerPage({ hideNavbar = false }) {
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active view tab: 'daily' | 'calendar' | 'weekly' | 'analysis' | 'subjects' | 'timeline' | 'analytics'
  const [currentTab, setCurrentTab] = useState("daily");

  // Modals & Panels
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState("");

  // Fetch all plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:5000/api/study-planner", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load study plans.");
      }

      const planList = json.data || [];
      setPlans(planList);

      if (planList.length > 0) {
        // Keep active plan or default to first
        const nextId = activePlanId && planList.some((p) => p.id === activePlanId)
          ? activePlanId
          : planList[0].id;
        setActivePlanId(nextId);
        await fetchPlanDetails(nextId);
      } else {
        setActivePlan(null);
      }
    } catch (err) {
      console.error("Error fetching study plans:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single plan details
  const fetchPlanDetails = async (planId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/study-planner/${planId}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActivePlan(json.data);
      }
    } catch (err) {
      console.error("Error fetching plan details:", err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handlePlanSelect = async (planId) => {
    setActivePlanId(planId);
    await fetchPlanDetails(planId);
  };

  const handlePlanCreated = (newPlan) => {
    setShowCreateWizard(false);
    setPlans((prev) => [newPlan, ...prev]);
    setActivePlanId(newPlan.id);
    setActivePlan(newPlan);
    setCurrentTab("daily");
  };

  const handleTaskUpdated = (taskId, updateData) => {
    if (!activePlan) return;
    const updatedTasks = (activePlan.tasks || []).map((t) =>
      t.id === taskId ? { ...t, ...updateData } : t
    );
    const completedCount = updatedTasks.filter((t) => t.status === "completed").length;
    const progress = updatedTasks.length > 0
      ? Math.round((completedCount / updatedTasks.length) * 100)
      : 0;

    setActivePlan({
      ...activePlan,
      tasks: updatedTasks,
      stats: {
        ...(activePlan.stats || {}),
        completedTasks: completedCount,
        progressPercentage: progress,
      },
    });
  };

  const handleRescheduled = async () => {
    setShowRescheduleModal(false);
    if (activePlanId) {
      await fetchPlanDetails(activePlanId);
    }
  };

  const openAssistantWithTopic = (prompt) => {
    setAssistantInitialPrompt(prompt);
    setAssistantOpen(true);
  };

  const tabs = [
    { id: "daily", label: "Daily Tasks", icon: CheckCircle2 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "weekly", label: "Weekly Workload", icon: Clock },
    { id: "analysis", label: "Material Analysis", icon: BookOpen },
    { id: "subjects", label: "Subject Progress", icon: Layers },
    { id: "timeline", label: "Exam Timeline", icon: Flag },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {!hideNavbar && <Navbar />}

      {/* Sticky Secondary Action Bar */}
      <div className="sticky top-20 z-30 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Plan Selector or Quick Info */}
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs font-bold text-xs">
              <Sparkles size={16} />
            </span>
            {plans.length > 0 ? (
              <select
                value={activePlanId || ""}
                onChange={(e) => handlePlanSelect(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none hover:bg-slate-100 cursor-pointer"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-slate-700">
                AI Study Planner & Exam Scheduler
              </span>
            )}

            {activePlan && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-700">
                  {activePlan.stats?.progressPercentage || 0}% Prepared
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {activePlan.exams?.length || 0} exams scheduled
                </span>
              </div>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {activePlan && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                  title="Smart Rescheduling for missed days"
                >
                  <RefreshCw size={13} className="text-slate-500" />
                  <span>Reschedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssistantOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
                  title="Ask AI Study Assistant"
                >
                  <Sparkles size={13} className="text-indigo-600" />
                  <span>AI Tutor</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowCreateWizard(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>New Study Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        {loading && !activePlan ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4" />
            <p className="text-xs font-bold text-slate-500">
              Loading your study plans...
            </p>
          </div>
        ) : plans.length === 0 ? (
          /* Empty State: Inviting Hero Banner */
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-14 my-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-xs">
              <Sparkles size={36} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-4xl">
              Turn Your Materials & Syllabus <br />
              <span className="text-indigo-600">Into an Intelligent Study Plan</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
              Upload your lecture notes, textbook chapters, or past papers. Enter your exam dates and syllabus, and let ExamForge AI construct a realistic, day-by-day timetable with exact page mappings.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <BookOpen size={20} className="text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900">Document Page Mapping</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Matches every syllabus topic to specific chapter and page references.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Clock size={20} className="text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900">Balanced Pacing</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Distributes tasks realistically across available days to eliminate final-day cramming.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <RefreshCw size={20} className="text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900">Smart Rescheduling</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Missed a day? AI adapts your upcoming tasks while keeping completed progress safe.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateWizard(true)}
              className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition cursor-pointer"
            >
              <Sparkles size={18} />
              <span>Create Your First Study Plan</span>
            </button>
          </div>
        ) : (
          /* Active Study Plan Dashboard */
          <div className="space-y-6">
            {/* View Switcher Tabs Bar */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active View Container */}
            {currentTab === "daily" && (
              <DailyScheduleView
                plan={activePlan}
                onTaskUpdated={handleTaskUpdated}
                onOpenAssistantWithTopic={openAssistantWithTopic}
              />
            )}
            {currentTab === "calendar" && (
              <CalendarScheduleView
                plan={activePlan}
                onSelectDate={(date) => {
                  setCurrentTab("daily");
                }}
              />
            )}
            {currentTab === "weekly" && (
              <WeeklyScheduleView
                plan={activePlan}
                onTaskUpdated={handleTaskUpdated}
                onSelectDate={(date) => {
                  setCurrentTab("daily");
                }}
              />
            )}
            {currentTab === "analysis" && (
              <MaterialAnalysisView plan={activePlan} />
            )}
            {currentTab === "subjects" && (
              <SubjectProgressView plan={activePlan} />
            )}
            {currentTab === "timeline" && (
              <TimelineScheduleView plan={activePlan} />
            )}
            {currentTab === "analytics" && (
              <StudyAnalyticsView plan={activePlan} />
            )}
          </div>
        )}
      </main>

      {/* Create Plan Wizard Modal */}
      {showCreateWizard && (
        <CreateStudyPlanWizard
          onClose={() => setShowCreateWizard(false)}
          onPlanCreated={handlePlanCreated}
        />
      )}

      {/* Smart Reschedule Modal */}
      {showRescheduleModal && activePlan && (
        <RescheduleModal
          plan={activePlan}
          onClose={() => setShowRescheduleModal(false)}
          onRescheduled={handleRescheduled}
        />
      )}

      {/* AI Study Assistant Chat Drawer */}
      {activePlan && (
        <StudyAssistantChat
          plan={activePlan}
          isOpen={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          initialPrompt={assistantInitialPrompt}
        />
      )}
    </div>
  );
}
