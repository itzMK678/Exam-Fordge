
import React from "react";
import {
  UploadCloud,
  Brain,
  Target,
  FileText,
  FileCheck,
  MessageCircle,
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

const Feature = () => {
 const features = [
  {
    icon: FileText,
    title: "Upload Study Materials",
    description:
      "Upload PDF and DOCX documents to organize your study materials and turn them into AI-powered learning resources.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: FileCheck,
    title: "Generate Custom Exams",
    description:
      "Generate multiple-choice, short-answer, and long-answer questions with answers based on your study materials.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Brain,
    title: "AI Study Planner",
    description:
      "Create personalized study schedules by analyzing your materials, topics, and remaining days before exams.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: MessageCircle,
    title: "AI Lecture Insights",
    description:
      "Analyze lecture recordings to extract important discussions, key concepts, and dates or deadlines announced by teachers.",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: BookOpen,
    title: "Document Summaries",
    description:
      "Understand lengthy documents faster with concise AI-generated summaries, important points, and key concepts.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: MessageCircle,
    title: "AI Chat Tutor",
    description:
      "Ask questions about your uploaded documents, discuss individual questions, and get AI-powered explanations to understand difficult topics.",
    color: "bg-indigo-100 text-indigo-600",
  },
];

 
  const actions = [
    {
      icon: FileText,
      title: "Summarize my documents",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: FileCheck,
      title: "Generate a practice exam",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: MessageCircle,
      title: "Ask the AI tutor",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <>
  
     <section id="features" className="bg-slate-50 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl">

        {/* Section Heading */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Powerful Learning Tools
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Everything You Need to{" "}
            <span className="text-blue-600">Learn Smarter</span>
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
            Turn your study documents into summaries, personalized exams,
            and interactive learning experiences with ExamForge AI.
          </p>
        </div>

        

          {/* Feature Cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
                >
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}
                  >
                    <Icon size={23} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>

                  
                </div>
              );
            })}
          </div>

          
          
        

       

      </div>
      </section>
    </>
  );
};

export default Feature;
