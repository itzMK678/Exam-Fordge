import { useState, useEffect } from "react";
import {
  TrendingUp,
  BookOpen,
  PieChart,
  Layers,
  GraduationCap,
  MessageSquare,
  Headphones,
  CheckCircle2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LearningAnalyticsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`${API_URL}/api/admin/analytics`, {
          credentials: "include",
        });
        const json = await res.json();
        if (res.ok) setData(json.data);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const popularSubjects = data?.popularSubjects || [];
  const mostUsedFeatures = data?.mostUsedFeatures || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
          Student Learning Analytics
        </h2>
        <p className="text-xs text-slate-500">
          Curriculum subject trends, exam sizing preferences, and feature adoption.
        </p>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Avg Questions / Exam
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {data?.avgQuestionsPerExam || 10} Qs
          </p>
          <span className="text-[11px] text-slate-400">Balanced length</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Exams Created
          </span>
          <p className="mt-2 text-2xl font-black text-indigo-600">
            {data?.totalExamsGenerated || 0}
          </p>
          <span className="text-[11px] text-slate-400">Student exam sessions</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tutor Discussions
          </span>
          <p className="mt-2 text-2xl font-black text-blue-600">
            {data?.totalDiscussions || 0}
          </p>
          <span className="text-[11px] text-slate-400">Question chat sessions</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lectures Analyzed
          </span>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {data?.totalLecturesProcessed || 0}
          </p>
          <span className="text-[11px] text-slate-400">Classroom audio/video</span>
        </div>
      </div>

      {/* CHARTS / PROGRESS LIST DUAL COLUMN */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Most Popular Subjects */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Most Popular Exam Subjects</h3>
            <BookOpen size={16} className="text-slate-400" />
          </div>

          <div className="space-y-4">
            {popularSubjects.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No exam subjects recorded yet.
              </p>
            ) : (
              popularSubjects.map((sub, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{sub.topic}</span>
                    <span className="text-indigo-600">{sub.count} exams</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(15, (sub.count / (popularSubjects[0]?.count || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feature Usage Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Platform Feature Adoption</h3>
            <PieChart size={16} className="text-slate-400" />
          </div>

          <div className="space-y-4">
            {mostUsedFeatures.map((feat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">{feat.feature}</span>
                  <span className="text-blue-600">{feat.usagePercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${feat.usagePercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-950">
            <span className="font-bold">Insight: </span>
            Students frequently use the AI Tutor chatbot immediately following exam completion for questions marked incorrect.
          </div>
        </div>
      </div>
    </div>
  );
}
