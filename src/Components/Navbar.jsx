import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../CSS/Navbar.css';
import orthobotLogo from '../assets/orthobot.jpg';

const Navbar = ({ scrollToTop }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'FAQs', href: '#faqs' },
    { name: 'About Us', href: '#about' },
    { name: 'Contact Us', href: '#contact' },
    { name: 'Login/Signup', href: '#auth' }
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (href, sectionName) => {
    const normalizedName = sectionName.toLowerCase().replace(/\s+/g, '-');
    setActiveSection(normalizedName);
    setIsMenuOpen(false);
    
    // Smooth scroll to section with offset for navbar
    const element = document.querySelector(href);
    if (element) {
      const navbarHeight = 60; // Height of fixed navbar
      const elementPosition = element.offsetTop - navbarHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.navbar')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Auto-detect current section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'how-it-works', 'faqs', 'about', 'contact', 'auth'];
      const scrollPosition = window.scrollY + 150; // Increased offset for better detection
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Check if we're at the bottom of the page
      if (window.scrollY + windowHeight >= documentHeight - 50) {
        setActiveSection('contact');
        return;
      }

      // Find the section that's currently in view
      let currentSection = 'home';
      for (let i = 0; i < sections.length; i++) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + window.scrollY;
          const sectionHeight = rect.height;
          
          // Check if section is in viewport (with some tolerance)
          if (scrollPosition >= sectionTop - 100 && scrollPosition < sectionTop + sectionHeight - 100) {
            currentSection = sections[i];
            break;
          }
        }
      }
      
      setActiveSection(currentSection);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    handleScroll(); // Check initial position
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, []);

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo" onClick={scrollToTop} style={{ cursor: 'pointer' }}>
          <div className="logo-image">
            <img src={orthobotLogo} alt="OrthoBot AI" /> 
          </div>
          <div className="logo-text">
            <h1 className="brand-name">
              <span className="ortho">Ortho</span>
              <span className="bot">Bot</span>
              <span className="ai"> AI</span>
            </h1>
            <p className="tagline">Smart Recovery Assistant</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          {navLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.href}
              className={`nav-link ${activeSection === link.name.toLowerCase().replace(/\s+/g, '-') ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href, link.name);
              }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {link.name}
            </motion.a>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="mobile-menu-toggle" onClick={toggleMenu}>
          <motion.div
            className={`hamburger ${isMenuOpen ? 'open' : ''}`}
            animate={isMenuOpen ? "open" : "closed"}
          >
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: 45, y: 8 }
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              variants={{
                closed: { opacity: 1 },
                open: { opacity: 0 }
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: -45, y: -8 }
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <motion.div
        className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
        initial={{ x: '100%' }}
        animate={{ x: isMenuOpen ? 0 : '100%' }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="mobile-menu-content">
          {navLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.href}
              className={`mobile-nav-link ${activeSection === link.name.toLowerCase().replace(/\s+/g, '-') ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href, link.name);
              }}
              initial={{ opacity: 0, x: 50 }}
              animate={{ 
                opacity: isMenuOpen ? 1 : 0, 
                x: isMenuOpen ? 0 : 50 
              }}
              transition={{ 
                duration: 0.3, 
                delay: isMenuOpen ? index * 0.1 : 0 
              }}
              whileTap={{ scale: 0.95 }}
            >
              {link.name}
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <motion.div
          className="mobile-menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </motion.nav>
  );
};

export default Navbar;
