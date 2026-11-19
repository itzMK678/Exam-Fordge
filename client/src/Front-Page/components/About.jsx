
import React from "react";
import {
  Brain,
  FileText,
  Target,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  CalendarDays,
  Mic,
} from "lucide-react";

const About = () => {
  const features = [
    {
      icon: FileText,
      title: "Smart Document Summaries",
      description:
        "Transform lengthy PDF and DOCX study materials into concise summaries, important points, and key concepts to make learning easier.",
    },
    {
      icon: Target,
      title: "AI-Powered Exam Generation",
      description:
        "Generate customized practice exams with multiple-choice, short-answer, and long-answer questions, complete with answers and different difficulty levels.",
    },
    {
      icon: CalendarDays,
      title: "Personalized Study Planner",
      description:
        "Create personalized study schedules based on your uploaded materials, selected topics, and remaining days before exams to stay organized and prepared.",
    },
    {
      icon: Mic,
      title: "AI Lecture Analysis",
      description:
        "Analyze lecture recordings to extract important discussions, key concepts, topics covered, and important dates or deadlines announced by teachers.",
    },
    {
      icon: MessageCircle,
      title: "Your Personal AI Tutor",
      description:
        "Ask questions about your study materials, discuss individual exam questions, and receive AI-powered explanations to understand difficult concepts.",
    },
  ];

  const benefits = [
    "Learn directly from your own study materials",
    "Save time with AI-generated summaries and insights",
    "Prepare with customized exams and practice questions",
    "Extract important information and deadlines from lecture recordings",
    "Create organized study schedules based on exam timelines",
    "Understand difficult concepts with an AI study assistant",
  ];

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-white px-6 py-20 sm:py-28"
    >
      {/* Background Decorations */}
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-purple-100/60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Study Smarter with Your{" "}
            <span className="text-indigo-600">
              AI-Powered Learning Partner
            </span>
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
            ExamForge transforms the way you learn and prepare for exams.
            Turn study documents and lecture recordings into valuable
            learning resources, generate customized exams, create
            personalized study schedules, and get instant help from an
            AI tutor — all in one place.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Left Content */}
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={30} />
            </div>

            <h3 className="text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
              Everything You Need to Learn, Plan, and Prepare
            </h3>

            <p className="mt-5 leading-8 text-slate-600">
              Preparing for exams involves more than just reading notes.
              ExamForge brings your entire learning process together using
              AI. Understand your study materials, capture important
              information from lectures, organize your preparation, and
              test your knowledge — all through one intelligent platform.
            </p>

            <div className="mt-8 space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2
                    size={21}
                    className="mt-0.5 shrink-0 text-indigo-600"
                  />
                  <p className="text-slate-700">{benefit}</p>
                </div>
              ))}
            </div>

            <a
              href="#features"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Explore Features
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Right Feature Cards */}
          <div className="space-y-5">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group flex gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl sm:p-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon size={24} />
                  </div>

                  <div>
                    <h4 className="mb-2 font-bold text-slate-900 sm:text-lg">
                      {feature.title}
                    </h4>

                    <p className="text-sm leading-7 text-slate-600 sm:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
