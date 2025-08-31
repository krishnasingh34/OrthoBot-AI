import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Hero from './Components/Hero';
import Features from './Components/Features';
import HowItWorks from './Components/HowItWorks';
import ChatDemo from './Components/ChatDemo';
import FAQ from './Components/FAQ';
import Footer from './Components/Footer';
import Chat from './Components/Chat';

const HomePage = ({ scrollToTop }) => {
  return (
    <>
      <Navbar scrollToTop={scrollToTop} />
      <main className="main-content">
        <Hero />
        <Features />
        <HowItWorks />
        <ChatDemo />
        <FAQ />
      </main>
      <Footer />
    </>
  );
};

const App = () => {
  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage scrollToTop={scrollToTop} />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
