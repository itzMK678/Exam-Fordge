import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Files,
  Cpu,
  TrendingUp,
  Database,
  Activity,
  MessageSquare,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import AdminLoginScreen from "./components/AdminLoginScreen";
import OverviewSection from "./components/OverviewSection";
import UsersSection from "./components/UsersSection";
import ExamsSection from "./components/ExamsSection";
import DocumentsSection from "./components/DocumentsSection";
import AIMonitoringSection from "./components/AIMonitoringSection";
import LearningAnalyticsSection from "./components/LearningAnalyticsSection";
import RAGMonitoringSection from "./components/RAGMonitoringSection";
import SystemHealthSection from "./components/SystemHealthSection";
import FeedbackSection from "./components/FeedbackSection";
import ActivityLogsSection from "./components/ActivityLogsSection";
import SettingsSection from "./components/SettingsSection";

function AdminDashboardContent() {
  const { admin, loading, isSetupRequired, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-400">Verifying administrator authorization...</p>
      </div>
    );
  }

  // If not logged in or setup required, show the dedicated login screen
  if (!admin || isSetupRequired) {
    return <AdminLoginScreen />;
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "exams", label: "Exams", icon: GraduationCap },
    { id: "documents", label: "Documents", icon: Files },
    { id: "ai", label: "AI Monitoring", icon: Cpu },
    { id: "analytics", label: "Learning Analytics", icon: TrendingUp },
    { id: "rag", label: "RAG Monitoring", icon: Database },
    { id: "health", label: "System Health", icon: Activity },
    { id: "feedback", label: "Feedback & Support", icon: MessageSquare },
    { id: "logs", label: "Activity Logs", icon: ShieldAlert },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-950 text-slate-300 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-500/20">
                <ShieldCheck size={20} />
              </span>
              <div>
                <span className="text-sm font-black tracking-tight text-white block">
                  ExamForge
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block -mt-0.5">
                  Boss Control
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs shadow-blue-600/30"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Info & Logout */}
        <div className="p-4 border-t border-slate-900 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white uppercase">
              {admin.username?.charAt(0) || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white leading-tight">
                {admin.username}
              </p>
              <p className="truncate text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Administrator
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block -mb-0.5">
                Admin Panel
              </span>
              <h1 className="text-base font-black capitalize text-slate-900 sm:text-lg">
                {activeTab.replace(/_/g, " ")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Admin: {admin.username}</span>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View Student App ↗
            </a>
          </div>
        </header>

        {/* Section View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "overview" && <OverviewSection onNavigate={setActiveTab} />}
          {activeTab === "users" && <UsersSection />}
          {activeTab === "exams" && <ExamsSection />}
          {activeTab === "documents" && <DocumentsSection />}
          {activeTab === "ai" && <AIMonitoringSection />}
          {activeTab === "analytics" && <LearningAnalyticsSection />}
          {activeTab === "rag" && <RAGMonitoringSection />}
          {activeTab === "health" && <SystemHealthSection />}
          {activeTab === "feedback" && <FeedbackSection />}
          {activeTab === "logs" && <ActivityLogsSection />}
          {activeTab === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

export default function BossAdminDashboard() {
  return (
    <AdminAuthProvider>
      <AdminDashboardContent />
    </AdminAuthProvider>
  );
}
