import React from 'react';
import { motion } from 'framer-motion';
import '../CSS/Hero.css';
import logoImage from '../assets/Dr_Logo.png';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="hero-container">
        {/* Left Content */}
        <motion.div 
          className="hero-content"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="hero-headline">
            Your Virtual Orthopedic Assistant — <span className="highlight">Anytime, Anywhere</span>
          </h1>
          
          <p className="hero-subheading">
            Ask questions about post-op care, exercises, medication, and get instant, reliable answers.
          </p>
          
          <div className="hero-buttons">
            <motion.button 
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Start Chat
            </motion.button>
            
            <motion.button 
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>

        {/* Right Image */}
        <motion.div 
          className="hero-image"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <div className="doctor-placeholder">
            <div className="doctor-logo">
              <img src={logoImage} alt="OrthoBot AI Logo" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
