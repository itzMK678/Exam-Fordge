
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
      {/* =========================
          NAVIGATION
      ========================= */}
     <Navbar/>

      {/* =========================
          HERO SECTION
      ========================= */}
      <section
        id="home"
        className="overflow-hidden bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/70"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
          {/* Hero Content */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <Sparkles size={16} />
              AI-Powered Learning Platform
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Turn Your Study Materials Into{" "}
              <span className="text-blue-600">Success</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Upload your PDF or DOCX files and let ExamForge create
              customized exams, provide summaries, and help you learn with an
              AI tutor — all in one place.
            </p>

            <div
              id="get-started"
              className="mt-8 flex flex-wrap gap-4"
            >
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Get Started Free
                <ArrowRight size={18} />
              </a>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
              >
                <Play size={16} fill="currentColor" />
                How It Works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-600">
              {[
                "Custom Exams",
                "Document Summaries",
                "AI Chat Tutor",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check size={17} className="text-green-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <HeroIllustration />
        </div>
      </section>

      {/* =========================
          FEATURES
      ========================= */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-5 py-20 sm:py-24 lg:px-8"
      >
        <SectionHeading
          label="Your AI Study Companion"
          title="Everything You Need to Ace Your Exams"
          description="Study smarter with AI. Upload, generate, learn, and achieve."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5"
              >
                <div
                  className={`mb-5 inline-flex rounded-2xl p-3.5 ${feature.color}`}
                >
                  <Icon size={27} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {feature.description}
                </p>

                <a
                  href="#how-it-works"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3"
                >
                  Learn more
                  <ArrowRight size={16} />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================= */}
      <section id="how-it-works" className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            label="Simple and Smart"
            title="How ExamForge Works"
            description="Go from your study material to exam-ready in three steps."
          />

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="rounded-2xl border border-slate-100 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-4xl font-extrabold text-blue-100">
                      {step.number}
                    </span>

                    <span className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                      <Icon size={27} />
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-500">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================
          ABOUT
      ========================= */}
      <section
        id="about"
        className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:py-24 lg:grid-cols-2 lg:gap-20 lg:px-8"
      >
        {/* About Illustration */}
        <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-10">
          <div className="absolute h-64 w-64 rounded-full border border-white/20" />

          <div className="absolute h-48 w-48 rounded-full border border-white/20" />

          <div className="relative rounded-3xl bg-white/15 p-8 text-white shadow-2xl backdrop-blur-sm">
            <GraduationCap size={88} strokeWidth={1.5} />
          </div>

          <div className="absolute left-3 top-7 flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-xs font-bold text-slate-700 shadow-lg sm:left-6 sm:px-4">
            <Sparkles size={17} className="text-blue-600" />
            AI-powered learning
          </div>

          <div className="absolute bottom-7 right-3 flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-xs font-bold text-slate-700 shadow-lg sm:right-6 sm:px-4">
            <Zap size={17} className="text-amber-500" />
            Learn at your pace
          </div>
        </div>

        {/* About Content */}
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            About ExamForge
          </span>

          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Make Every Study Session Count
          </h2>

          <p className="mt-5 leading-8 text-slate-600">
            ExamForge is an AI-powered learning platform designed to help
            students prepare for exams using their own study materials.
            Instead of spending hours searching through lengthy notes,
            students can turn their documents into interactive learning
            experiences.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            With AI-generated exams, document summaries, and a
            context-aware tutoring chatbot, ExamForge makes it easier to
            practice questions, review answers, and understand challenging
            concepts.
          </p>

          <div className="mt-6 space-y-4">
            {[
              "Learn from your own documents",
              "Practice with customized questions",
              "Get context-aware AI explanations",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm font-medium text-slate-700"
              >
                <span className="rounded-full bg-green-100 p-1 text-green-600">
                  <Check size={16} />
                </span>

                {item}
              </div>
            ))}
          </div>

          <a
            href="#features"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700"
          >
            Explore Features
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}
      <Footer/>
    </div>
  );
};

export default Mainpage;
