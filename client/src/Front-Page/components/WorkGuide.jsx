import React from 'react'
import { Link } from 'react-router-dom';
import {Brain,ArrowRight,UploadCloud,
  Target,
} from "lucide-react";
const WorkGuide = () => {
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
    <div id='How-work'>
       {/* How It Works */}
        <div className="mt-24 border-t border-slate-200 pt-16">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Simple Process
            </span>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              How ExamForge Works
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              Three simple steps to turn your documents into a more effective
              study experience.
            </p>
          </div>
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {steps.map((step) => {
    const Icon = step.icon;

    return (
      <div
        key={step.number}
        className="group relative rounded-2xl border border-slate-200 bg-white m-2 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-xl"
      >
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
          <Icon size={28} />
        </div>

        {/* Step Number */}
        <span className="text-xs font-bold tracking-widest text-blue-600">
          STEP {step.number}
        </span>

        {/* Title */}
        <h3 className="mt-3 text-lg font-bold text-slate-900">
          {step.title}
        </h3>

        {/* Description */}
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">
          {step.description}
        </p>
      </div>
    );
  })}
</div>
          
        </div>
      
         <div className="mt-20 bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-10 text-center text-white sm:px-12 sm:py-14">
          <Brain size={38} className="mx-auto mb-5" />

          <h3 className="text-2xl font-bold sm:text-3xl">
            Your Learning. Your Materials. Your Progress.
          </h3>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-indigo-100">
            Make every study session more focused with tools designed to help
            you understand your material, practice effectively, and prepare
            for your next exam.
          </p>

          <a
            href="/work"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Get Started
            <ArrowRight size={18} />
          </a>
          
        </div>
    </div>
  )
}

export default WorkGuide