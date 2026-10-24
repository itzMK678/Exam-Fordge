
import React from "react";
import {
  Brain,
  FileText,
  Target,
  MessageCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

const About = () => {
  const features = [
    {
      icon: FileText,
      title: "Smart Document Summaries",
      description:
        "Turn lengthy PDF and DOCX study materials into clear, concise summaries that help you focus on what matters.",
    },
    {
      icon: Target,
      title: "AI-Powered Exam Practice",
      description:
        "Generate personalized practice exams with different difficulty levels to test your knowledge and prepare confidently.",
    },
    {
      icon: MessageCircle,
      title: "Your Personal AI Tutor",
      description:
        "Ask questions about your study material and get helpful explanations to understand difficult concepts.",
    },
  ];

  const benefits = [
    "Learn directly from your own study materials",
    "Save time with AI-generated summaries",
    "Practice with customized exam questions",
    "Understand concepts with an AI study assistant",
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
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            <Sparkles size={16} />
            About ExamForge
          </span>

          <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Study Smarter with Your
            <span className="text-indigo-600"> AI Study Partner</span>
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
            ExamForge transforms the way you prepare for exams. Upload your
            study documents, generate intelligent summaries and practice
            questions, and learn with an AI tutor — all in one place.
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
              Everything You Need to Prepare with Confidence
            </h3>

            <p className="mt-5 leading-8 text-slate-600">
              Studying does not have to mean spending hours searching through
              notes or creating practice questions manually. ExamForge uses
              AI to help you organize your learning, test your understanding,
              and make better use of your study time.
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
                    <div className="mb-2 flex items-center gap-3">
                      <h4 className="font-bold text-slate-900 sm:text-lg">
                        {feature.title}
                      </h4>
                    </div>

                    <p className="text-sm leading-7 text-slate-600 sm:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Highlight */}
       
      </div>
    </section>
  );
};

export default About;