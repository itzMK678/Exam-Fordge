import React from 'react';
import { 
  FileText, 
  Sparkles, 
  MessageSquare, 
  GraduationCap, 
  CheckCircle2, 
  FileCode, 
  Zap 
} from 'lucide-react';

export default function HeroGraphic() {
  // Config for revolving small badges around the main document
  const floatingIcons = [
    { icon: <FileText className="w-5 h-5 text-red-500" />, label: 'PDF', angle: 0 },
    { icon: <Sparkles className="w-5 h-5 text-amber-500" />, label: 'AI Summary', angle: 72 },
    { icon: <MessageSquare className="w-5 h-5 text-blue-500" />, label: 'AI Tutor', angle: 144 },
    { icon: <GraduationCap className="w-5 h-5 text-indigo-500" />, label: 'Quiz Prep', angle: 216 },
    { icon: <Zap className="w-5 h-5 text-emerald-500" />, label: 'Flashcards', angle: 288 },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center">
      {/* Background Decorative Rings / Orbit Lines */}
      <div className="absolute inset-0 rounded-full border border-blue-100/60 animate-spin-slow pointer-events-none" 
           style={{ animationDuration: '35s' }} />
      <div className="absolute inset-12 rounded-full border border-dashed border-blue-200/50 pointer-events-none" />

      {/* Orbiting Container */}
      <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '25s' }}>
        {floatingIcons.map((item, index) => {
          // Position icons on an orbital circular radius
          const radius = 175; // Distance from center in px
          const rad = (item.angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;

          return (
            <div
              key={index}
              className="absolute left-1/2 top-1/2 -ml-6 -mt-6 transition-all duration-300 hover:scale-110"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              {/* Counter-rotate content so icons stay upright while revolving */}
              <div 
                className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-100 text-xs font-semibold text-slate-700 animate-counter-rotate"
                style={{ animationDuration: '25s' }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Central Hero Document Graphic */}
      <div className="relative z-10 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 backdrop-blur-sm transform hover:-translate-y-1 transition-transform duration-300">
        {/* Decorative Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
            Processed
          </span>
        </div>

        {/* Mock Document Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">Biology_Final_Notes.pdf</p>
              <p className="text-[11px] text-slate-400">2.4 MB • 18 Pages</p>
            </div>
          </div>

          {/* AI Extraction Micro-Card */}
          <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-blue-600">
                <Sparkles className="w-3.5 h-3.5" /> Key Concepts
              </span>
              <span className="text-[10px] text-slate-400">100% Ready</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full w-full animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 25 Flashcards generated
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}