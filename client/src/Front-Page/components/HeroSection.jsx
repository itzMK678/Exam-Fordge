import React from 'react'
import {GraduationCap,FileText,FileCheck,Brain,
  MessageCircle,ArrowRight,Play,Check,Menu,
  X,Sparkles,UploadCloud,BookOpen,
  Target,Zap,Link,
} from "lucide-react";
import HeroGraphic from './HeroGraphic';
const HeroSection = () => {
  const  handleClick = () => {
    console.log("clicked");
  }
  return (
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
                
              >
                
                
              </a>
              <button onClick={handleClick}> work</button>
<Link to= "/work" 

className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
                Get Started Free
              </Link>

              
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
          <HeroGraphic/>
        </div>
      </section>
  )
}

export default HeroSection