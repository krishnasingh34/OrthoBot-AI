import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../CSS/Navbar.css";
import orthobotLogo from "../assets/orthobot.jpg";

const Navbar = ({ scrollToTop }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const navigate = useNavigate();

  const navLinks = [
    { name: "Home", href: "#home", id: "home", path: "/" },
    { name: "Features", href: "#features", id: "features", path: "/" },
    { name: "How it Works", href: "#how-it-works", id: "how-it-works", path: "/" },
    { name: "FAQs", href: "#faqs", id: "faqs", path: "/" },
    { name: "About Us", href: "/about", id: "about", path: "/about" },
    { name: "Contact Us", href: "/contact", id: "contact", path: "/contact" },
    { name: "Login/Signup", href: "#auth", id: "auth", path: "/" },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleNavClick = (href, sectionName, sectionId) => {
    setActiveSection(sectionId);
    setIsMenuOpen(false);

    if (href.startsWith("#")) {
      // If we're not on the home page, navigate there first
      if (window.location.pathname !== "/") {
        navigate("/");
        // Wait for the home page to load before scrolling
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            const navbarHeight = 60;
            const elementPosition = element.offsetTop - navbarHeight;
            window.scrollTo({
              top: elementPosition,
              behavior: "smooth",
            });
          }
        }, 100);
      } else {
        // Already on home page, just scroll to section
        const element = document.querySelector(href);
        if (element) {
          const navbarHeight = 60;
          const elementPosition = element.offsetTop - navbarHeight;
          window.scrollTo({
            top: elementPosition,
            behavior: "smooth",
          });
        }
      }
    } else {
      // Navigate to route and scroll to top
      navigate(href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(".navbar")) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Set active section based on route and handle scroll
  useEffect(() => {
    const path = window.location.pathname;
    
    // Set active section based on route
    if (path === '/about') {
      setActiveSection('about');
      return;
    } else if (path === '/contact') {
      setActiveSection('contact');
      return;
    } else if (path === '/privacy-policy') {
      setActiveSection('privacy');
      return;
    } else if (path === '/terms-conditions') {
      setActiveSection('terms');
      return;
    }

    // Only handle scroll-based highlighting on home page
    if (path === '/') {
      const handleScroll = () => {
        const sections = ["home", "features", "how-it-works", "faqs", "auth"];
        const scrollPosition = window.scrollY + 150;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (window.scrollY + windowHeight >= documentHeight - 50) {
          setActiveSection("contact");
          return;
        }

        let currentSection = "home";
        for (let i = 0; i < sections.length; i++) {
          const section = document.getElementById(sections[i]);
          if (section) {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionHeight = rect.height;
            if (
              scrollPosition >= sectionTop - 100 &&
              scrollPosition < sectionTop + sectionHeight - 100
            ) {
              currentSection = sections[i];
              break;
            }
          }
        }
        setActiveSection(currentSection);
      };

      // Add scroll event listener
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Initial check
      handleScroll();
      
      // Cleanup
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [window.location.pathname]);

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="navbar-container">
        {/* Logo */}
        <div
          className="navbar-logo"
          onClick={scrollToTop}
          style={{ cursor: "pointer" }}
        >
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

        {/* Desktop Links */}
        <div className="navbar-links">
          {navLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.href}
              className={`nav-link ${
                activeSection === link.id ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href, link.name, link.id);
              }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              style={{ cursor: "pointer" }}
            >
              {link.name}
            </motion.a>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <div className="mobile-menu-toggle" onClick={toggleMenu}>
          <motion.div
            className={`hamburger ${isMenuOpen ? "open" : ""}`}
            animate={isMenuOpen ? "open" : "closed"}
          >
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: 45, y: 8 },
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              variants={{
                closed: { opacity: 1 },
                open: { opacity: 0 },
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: -45, y: -8 },
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <motion.div
        className={`mobile-menu ${isMenuOpen ? "open" : ""}`}
        initial={{ x: "100%" }}
        animate={{ x: isMenuOpen ? 0 : "100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="mobile-menu-content">
          {navLinks.map((link, index) =>
            link.href.startsWith("#") ? (
              <motion.a
                key={index}
                href={link.href}
                className={`mobile-nav-link ${
                  activeSection ===
                  link.name.toLowerCase().replace(/\s+/g, "-")
                    ? "active"
                    : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href, link.name, link.id);
                }}
                initial={{ opacity: 0, x: 50 }}
                animate={{
                  opacity: isMenuOpen ? 1 : 0,
                  x: isMenuOpen ? 0 : 50,
                }}
                transition={{
                  duration: 0.3,
                  delay: isMenuOpen ? index * 0.1 : 0,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {link.name}
              </motion.a>
            ) : (
              <motion.span
                key={index}
                className="mobile-nav-link"
                onClick={() => handleNavClick(link.href, link.name)}
                initial={{ opacity: 0, x: 50 }}
                animate={{
                  opacity: isMenuOpen ? 1 : 0,
                  x: isMenuOpen ? 0 : 50,
                }}
                transition={{
                  duration: 0.3,
                  delay: isMenuOpen ? index * 0.1 : 0,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {link.name}
              </motion.span>
            )
          )}
        </div>
      </motion.div>

      {/* Overlay */}
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
