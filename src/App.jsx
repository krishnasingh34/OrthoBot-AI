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
import SharedChatViewer from './Components/SharedChatViewer';
import AboutUs from './Components/AboutUs';
import ContactUs from './Components/ContactUs';
import PrivacyPolicy from './Components/PrivacyPolicy';
import TermsConditions from './Components/TermsConditions';

const HomePage = ({ scrollToTop }) => {
  return (
    <div className="page-layout">
      <Navbar scrollToTop={scrollToTop} />
      <main className="main-content">
        <Hero />
        <Features />
        <HowItWorks />
        <ChatDemo />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

const PageLayout = ({ children }) => {
  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
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
          <Route path="/share/:shareId" element={<SharedChatViewer />} />
          <Route path="/about" element={
            <PageLayout>
              <AboutUs />
            </PageLayout>
          } />
          <Route path="/contact" element={
            <PageLayout>
              <ContactUs />
            </PageLayout>
          } />
          <Route path="/privacy-policy" element={
            <PageLayout>
              <PrivacyPolicy />
            </PageLayout>
          } />
          <Route path="/terms-conditions" element={
            <PageLayout>
              <TermsConditions />
            </PageLayout>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
