
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Menu,
  X,
  BookOpen,
  FileText,
  Brain,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    ["Home", "#home"],
    ["Features", "#features"],
    ["About", "#about"],
    ["How It Works", "#how-it-works"],
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a
          href="#home"
          onClick={closeMenu}
          className="flex items-center gap-2 text-2xl font-extrabold text-slate-900"
        >
          <span className="rounded-xl bg-blue-600 p-2 text-white">
            <GraduationCap size={26} />
          </span>
          Exam<span className="text-blue-600">Forge</span>
        </a>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div
          className={`${
            menuOpen ? "flex" : "hidden"
          } absolute left-0 top-full w-full flex-col gap-5 border-b border-slate-200 bg-white p-6 shadow-lg md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={closeMenu}
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              {label}
            </a>
          ))}

          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              onClick={closeMenu}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-600"
            >
              Login
            </Link>

            <a
              href="#get-started"
              onClick={closeMenu}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

const Mainpage = () => {
  const features = [
    {
      icon: FileText,
      title: "AI Exam Generation",
      description:
        "Generate customized exams from your uploaded PDF and DOCX study materials.",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Brain,
      title: "Smart Summaries",
      description:
        "Turn lengthy study documents into clear, concise summaries for faster revision.",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: MessageCircle,
      title: "AI Tutor",
      description:
        "Ask questions about your learning material and discuss difficult concepts.",
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      icon: Target,
      title: "Flexible Difficulty",
      description:
        "Practice with questions tailored to your preferred difficulty and exam size.",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Upload Your Material",
      description:
        "Upload your PDF or DOCX notes, books, and study documents.",
    },
    {
      number: "02",
      title: "Generate Your Exam",
      description:
        "Choose your preferences and let AI create questions and answers.",
    },
    {
      number: "03",
      title: "Learn and Improve",
      description:
        "Review answers, explore summaries, and discuss concepts with your AI tutor.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      {/* Hero */}
      <section
        id="home"
        className="scroll-mt-24 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 md:grid-cols-2 md:py-28 lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
              <Sparkles size={16} />
              AI-powered learning platform
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Study smarter.
              <span className="block text-blue-600">
                Prepare better.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Turn your study documents into practice exams, smart summaries,
              and personalized AI tutoring with ExamForge.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Start Learning
                <ArrowRight size={19} />
              </Link>

              <a
                href="#features"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <CheckCircle size={17} className="text-emerald-600" />
                PDF and DOCX support
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle size={17} className="text-emerald-600" />
                AI-powered learning
              </span>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="relative">
            <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-blue-200/50 blur-2xl" />
            <div className="absolute -bottom-8 -right-5 h-40 w-40 rounded-full bg-purple-200/60 blur-2xl" />

            <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-blue-900/10 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-sm text-slate-500">Your workspace</p>
                  <h3 className="mt-1 text-xl font-bold">Study Dashboard</h3>
                </div>
                <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                  <GraduationCap size={27} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-blue-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-3 text-blue-600 shadow-sm">
                    <FileText size={25} />
                  </div>
                  <div>
                    <h4 className="font-bold">Computer Science Notes.pdf</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Study material uploaded
                    </p>
                  </div>
                  <CheckCircle
                    size={20}
                    className="ml-auto shrink-0 text-emerald-600"
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <div className="mb-3 w-fit rounded-lg bg-purple-100 p-2 text-purple-600">
                    <Brain size={22} />
                  </div>
                  <p className="text-sm text-slate-500">AI Questions</p>
                  <p className="mt-1 text-2xl font-bold">Practice</p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <div className="mb-3 w-fit rounded-lg bg-emerald-100 p-2 text-emerald-600">
                    <BookOpen size={22} />
                  </div>
                  <p className="text-sm text-slate-500">Study Notes</p>
                  <p className="mt-1 text-2xl font-bold">Review</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white">
                <Zap size={24} className="shrink-0 text-yellow-400" />
                <div>
                  <p className="font-semibold">Your AI tutor is ready</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Ask questions and understand concepts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 px-5 py-20 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="font-semibold text-blue-600">WHAT YOU CAN DO</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Everything you need to learn better
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Make your study sessions more productive with AI tools designed
              to help you understand and practice.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
                >
                  <div
                    className={`mb-5 w-fit rounded-xl p-3 ${feature.color}`}
                  >
                    <Icon size={27} />
                  </div>

                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="scroll-mt-24 bg-slate-50 px-5 py-20 md:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="font-semibold text-blue-600">ABOUT EXAMFORGE</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
              Turn your study material into an interactive learning experience.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              ExamForge helps students learn from their own documents. Instead
              of only reading pages of notes, you can generate practice
              questions, review answers, summarize content, and ask an AI tutor
              about difficult topics.
            </p>

            <a
              href="#how-it-works"
              className="mt-7 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800"
            >
              See how it works
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="rounded-3xl bg-blue-600 p-8 text-white shadow-xl shadow-blue-600/20 sm:p-10">
            <Sparkles size={36} />
            <h3 className="mt-6 text-2xl font-bold">
              Your documents. Your practice. Your progress.
            </h3>
            <p className="mt-4 leading-7 text-blue-100">
              Build understanding through personalized questions and
              explanations based on your learning material.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Upload your study documents",
                "Generate exams with answers",
                "Summarize key concepts",
                "Discuss topics with an AI tutor",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={20} className="shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 px-5 py-20 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="font-semibold text-blue-600">SIMPLE PROCESS</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              How ExamForge works
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Start with your study material and turn it into an effective
              practice session in three simple steps.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 p-7"
              >
                <span className="text-4xl font-extrabold text-blue-100">
                  {step.number}
                </span>
                <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section
        id="get-started"
        className="scroll-mt-24 px-5 pb-20 md:pb-24"
      >
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-center text-white sm:px-12 md:py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto w-fit rounded-2xl bg-white/10 p-3">
              <GraduationCap size={34} />
            </div>

            <h2 className="mt-6 text-3xl font-extrabold sm:text-4xl">
              Ready to transform the way you study?
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              Start using your study documents to practice, review, and
              understand concepts more effectively.
            </p>

            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-500"
            >
              Get Started
              <ArrowRight size={19} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <a
            href="#home"
            className="flex items-center gap-2 text-lg font-extrabold"
          >
            <GraduationCap size={23} className="text-blue-600" />
            Exam<span className="text-blue-600">Forge</span>
          </a>

          <p className="text-center text-sm text-slate-500">
            Learn smarter. Practice better. Grow with ExamForge.
          </p>

          <a
            href="#home"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Back to top ↑
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Mainpage;
