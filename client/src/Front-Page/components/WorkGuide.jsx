import React from 'react'
import {Brain,
  UploadCloud,
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
    <div>
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

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="relative text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Icon size={28} />
                  </div>

                  <span className="text-xs font-bold tracking-widest text-blue-600">
                    STEP {step.number}
                  </span>

                  <h3 className="mt-2 text-lg font-bold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
    </div>
  )
}

export default WorkGuide