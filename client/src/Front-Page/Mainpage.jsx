
import React, { useState } from "react";

import {
  GraduationCap,
  FileText,
  FileCheck,
  Brain,
  MessageCircle,
  ArrowRight,
  Play,
  Check,
  Menu,
  X,
  Sparkles,
  UploadCloud,
  BookOpen,
  Target,
  Zap,
  Link,
} from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/* =========================
   REUSABLE SECTION HEADING
========================= */
const SectionHeading = ({ label, title, description }) => {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
        {label}
      </span>

      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 leading-7 text-slate-500">{description}</p>
    </div>
  );
};
const handleClick = () => {
  console.log("Clicked!");
};

/* =========================
   HERO ILLUSTRATION
========================= */
const HeroIllustration = () => {
  const actions = [
    {
      icon: FileCheck,
      title: "Generate Exam",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: BookOpen,
      title: "Summarize Document",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Brain,
      title: "AI Tutor",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="relative mx-auto flex min-h-[400px] w-full max-w-xl items-center justify-center sm:min-h-[480px]">
      <div className="absolute h-72 w-72 rounded-full bg-blue-200/50 blur-3xl sm:h-96 sm:w-96" />

      {/* PDF File */}
      <div className="absolute left-3 top-12 rotate-[-10deg] rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:left-10">
        <FileText className="text-red-500" size={25} />
        <p className="mt-1 text-xs font-bold text-slate-600">PDF FILE</p>
      </div>

      {/* DOCX File */}
      <div className="absolute right-3 top-20 rotate-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:right-8">
        <FileText className="text-blue-600" size={25} />
        <p className="mt-1 text-xs font-bold text-slate-600">DOCX FILE</p>
      </div>

      <Sparkles
        className="absolute left-12 top-40 text-blue-500"
        size={23}
      />

      <Sparkles
        className="absolute bottom-24 right-12 text-purple-500"
        size={27}
      />

      {/* Main AI Card */}
      <div className="relative z-10 w-[88%] max-w-md rounded-2xl border border-white bg-white p-3 shadow-2xl shadow-blue-900/10 sm:p-5">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between bg-white px-4 py-4">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="rounded-lg bg-blue-100 p-2 text-blue-600">
                <GraduationCap size={20} />
              </span>

              ExamForge AI
            </div>

            <Sparkles className="text-blue-500" size={18} />
          </div>

          <div className="p-4 sm:p-6">
            <p className="mb-5 text-lg font-bold text-slate-800">
              What would you like to do?
            </p>

            {actions.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="mb-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-blue-200 hover:shadow-sm"
                >
                  <span className={`rounded-lg p-2 ${item.color}`}>
                    <Icon size={19} />
                  </span>

                  <span className="flex-1 text-sm font-semibold text-slate-700">
                    {item.title}
                  </span>

                  <ArrowRight size={17} className="text-slate-400" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating AI Assistant */}
      <div className="absolute bottom-3 left-0 z-20 flex max-w-[95%] items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl sm:bottom-8 sm:left-3 sm:p-4">
        <span className="rounded-xl bg-blue-600 p-3 text-white">
          <Brain size={23} />
        </span>

        <div>
          <p className="text-sm font-bold text-slate-800">
            AI Study Assistant
          </p>

          <p className="text-xs text-slate-500">
            Ask anything about your notes
          </p>
        </div>
      </div>
    </div>
  );
};

/* =========================
   MAIN PAGE
========================= */
const Mainpage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  /* Navigation Links */
  const links = [
    ["Home", "#home"],
    ["Features", "#features"],
    ["About", "#about"],
    ["How It Works", "#how-it-works"],
  ];

  /* Features */
  const features = [
    {
      icon: FileText,
      title: "Upload Your Files",
      description:
        "Upload PDF and DOCX documents and turn your study materials into learning resources.",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: FileCheck,
      title: "Generate Custom Exams",
      description:
        "Create multiple-choice, short-answer, and long-answer questions with answers.",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Brain,
      title: "Document Summaries",
      description:
        "Understand lengthy documents faster with concise summaries and key concepts.",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: MessageCircle,
      title: "AI Chat Tutor",
      description:
        "Ask questions about your documents and understand difficult topics.",
      color: "bg-pink-100 text-pink-600",
    },
  ];

  /* How It Works */
  const steps = [
    {
      number: "01",
      icon: UploadCloud,
      title: "Upload Your Material",
      description: "Choose your PDF or DOCX study documents.",
    },
    {
      number: "02",
      icon: Brain,
      title: "Let AI Understand",
      description:
        "Your content is processed to provide relevant context.",
    },
    {
      number: "03",
      icon: Target,
      title: "Learn and Practice",
      description:
        "Generate exams, review answers, and chat with your AI tutor.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
    
     <Navbar/>

   
     

      {/* =========================
          FEATURES
      ========================= */}
    
      {/* =========================
          ABOUT
      ========================= */}
     

      
      <Footer/>
    </div>
  );
};

export default Mainpage;
