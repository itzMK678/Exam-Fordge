

const handleClick = () => {
  console.log("Clicked!");
};

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
  
  /* How It Works */
 

  return (
    <div className="min-h-screen bg-white text-slate-900">
    
     <Navbar/>

   
     

    
     

      
      <Footer/>
    </div>
  );
};

export default Mainpage;
