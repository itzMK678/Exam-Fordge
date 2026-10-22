
import React, { useState } from "react";

import {GraduationCap,FileText,FileCheck,Brain,
  MessageCircle,ArrowRight,Play,Check,Menu,
  X,Sparkles,UploadCloud,BookOpen,
  Target,Zap,Link,
} from "lucide-react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import Feature from "./components/Feature";
import WorkGuide from "./components/WorkGuide";
import About from "./components/About";
const mainpage = () => {
  return (
    <>
      <Navbar />
      
         <HeroSection/>
      <About/>
     
      <Feature/>
      <WorkGuide/>
       
      <Footer />
    </>
  )
}

export default mainpage