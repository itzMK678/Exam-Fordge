import React from 'react'
import { GraduationCap } from 'lucide-react'
const Footer = () => {
  return (
    <footer className="bg-slate-950 px-5 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <a
            href="#home"
            className="flex items-center gap-2 text-xl font-extrabold"
          >
            <GraduationCap size={28} className="text-blue-400" />

            Exam<span className="text-blue-400">Forge</span>
          </a>

          <p className="text-sm text-slate-400">
            Learn smarter. Practice better. Achieve more.
          </p>

          <div className="flex flex-wrap justify-center gap-5 text-sm text-slate-400">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>

            <a href="#about" className="transition hover:text-white">
              About
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-white"
            >
              How It Works
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ExamForge. All rights reserved.
        </div>
      </footer>
  )
}

export default Footer