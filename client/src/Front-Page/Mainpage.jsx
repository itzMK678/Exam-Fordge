
import React from "react";

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