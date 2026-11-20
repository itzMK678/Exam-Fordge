import React, { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  
  Headphones,
  Calendar,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import Navbar from "../Front-Page/components/Navbar";

const UploadPage = lazy(() => import("./UploadPage"));
const DailyLecturePage = lazy(() => import("../Lecture-Intelligence/DailyLecturePage"));
const StudyPlannerPage = lazy(() => import("../Study-Planner/StudyPlannerPage"));

export default function WorkPage({ defaultTab = "exam" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") || searchParams.get("option");

  // Validate or default tab state: 'exam' | 'lecture' | 'planner'
  const validTabs = ["exam", "lecture", "planner"];
  const initialTab = validTabs.includes(urlTab) ? urlTab : defaultTab;

  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab changes with URL query parameter without full-page reloads
  useEffect(() => {
    if (urlTab && validTabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

 const handleSelectTab = (tabId) => {
  setActiveTab(tabId);
  setSearchParams({ tab: tabId }, { replace: true });

  window.scrollBy({
    top: 80, // Scroll down 80px
    behavior: "smooth",
  });
};

  const tabs = [
    {
      id: "exam",
      title: "Generate Exam from PDF",
      shortLabel: "Exam Generator",
      badge: "Document AI",
       icon: GraduationCap,
      color: "indigo",
      activeBg: "bg-indigo-600 text-white shadow-md shadow-indigo-600/25",
      inactiveBg: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
      accentBorder: "border-indigo-600",
      badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    {
      id: "lecture",
      title: "Use Recorded Lectures to Study",
      shortLabel: "Lecture Intelligence",
      badge: "Audio & Video AI",
      icon: Headphones,
      color: "blue",
      activeBg: "bg-blue-600 text-white shadow-md shadow-blue-600/25",
      inactiveBg: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
      accentBorder: "border-blue-600",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    },
    {
      id: "planner",
      title: "Create Study Plane for Multiple Exams",
      shortLabel: "Syllabus & Timetable",
      badge: "Exam Scheduler",
      icon: Calendar,
      color: "emerald",
      activeBg: "bg-emerald-600 text-white shadow-md shadow-emerald-600/25",
      inactiveBg: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
      accentBorder: "border-emerald-600",
      badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Unified Main Navigation */}
      <Navbar />

      {/* =========================================================================
          WORKSPACE HEADER & 3-OPTION MODE SELECTOR
      ========================================================================= */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md pt-6 pb-5 shadow-2xs print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header Title & Subtitle */}
          <div className=" gap-4 mb-6">
            <div>
              <div className="flex items-center  gap-2 mb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                 <GraduationCap size={16} />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                  ExamForge Studio Workspace
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Choose Your Study Mode
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
                Select between generating exams from documents, transcribing classroom lectures, or planning your multi-exam schedule.
              </p>
            </div>

            {/* Quick Actions */}
            {/* <div className="flex items-center gap-2.5">
              <Link
                to="/history"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                title="View past generated exams and history"
              >
                <History size={15} />
                <span>Saved Exams</span>
              </Link>
            </div> */}
          </div>

          {/* =====================================================================
              THE 3 OPTIONS SELECTOR (Responsive Interactive Cards)
          ===================================================================== */}
          <div
            role="tablist"
            aria-label="Workspace Study Modes"
            className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
          >
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`group relative flex flex-col text-left rounded-2xl p-4 sm:p-5 transition-all duration-200 border-2 cursor-pointer ${
                    isSelected
                      ? `border-blue-600 bg-white ring-4 ring-blue-500/10 shadow-md`
                      : `border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs`
                  }`}
                >
                  {/* Top Row: Icon + Badge + Selection Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                        isSelected
                          ? `bg-blue-600 text-white shadow-sm shadow-blue-600/30`
                          : `bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900`
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isSelected
                            ? `border-blue-200 bg-blue-50 text-blue-700`
                            : `border-slate-200 bg-slate-100 text-slate-600`
                        }`}
                      >
                        {tab.badge}
                      </span>

                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                          <CheckCircle2 size={13} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                    {tab.title}
                  </h2>

                 

                  {/* Bottom selection indicator underline */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <span
                      className={
                        isSelected ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      }
                    >
                      {isSelected ? "● Active Studio" : "Click to Switch"}
                    </span>
                   
                  </div>
                </button>
              );
            })}
          </div>

          {/* =====================================================================
              DYNAMIC OPTION TOOLBAR (Changes dynamically based on active option)
          ===================================================================== */}
         
        </div>
      </header>

      {/* =========================================================================
          DYNAMIC WORKSPACE CONTENT (Renders the selected tool)
      ========================================================================= */}
      <main className="flex-1 w-full">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          }
        >
          {activeTab === "exam" && (
            <div
              id="panel-exam"
              role="tabpanel"
              aria-labelledby="tab-exam"
              tabIndex={0}
              className="w-full focus:outline-none"
            >
              <UploadPage hideNavbar={true} />
            </div>
          )}

          {activeTab === "lecture" && (
            <div
              id="panel-lecture"
              role="tabpanel"
              aria-labelledby="tab-lecture"
              tabIndex={0}
              className="w-full focus:outline-none"
            >
              <DailyLecturePage hideNavbar={true} />
            </div>
          )}

          {activeTab === "planner" && (
            <div
              id="panel-planner"
              role="tabpanel"
              aria-labelledby="tab-planner"
              tabIndex={0}
              className="w-full focus:outline-none"
            >
              <StudyPlannerPage hideNavbar={true} />
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
