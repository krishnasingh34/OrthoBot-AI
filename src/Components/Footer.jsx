import React from 'react';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import '../CSS/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <FooterContent />
    </footer>
  );
};

const FooterContent = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: 'About', href: '#about' },
    { name: 'Terms', href: '#terms' },
    { name: 'Privacy', href: '#privacy' },
    { name: 'Contact', href: '#contact' }
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#facebook' },
    { name: 'Twitter', icon: Twitter, href: '#twitter' },
    { name: 'Instagram', icon: Instagram, href: '#instagram' },
    { name: 'LinkedIn', icon: Linkedin, href: '#linkedin' }
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <footer className="footer">
      <motion.div 
        className="footer-container"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="footer-content">
          <motion.div className="footer-section footer-brand" variants={itemVariants}>
            <h3 className="footer-logo">OrthoBot AI</h3>
            <p className="footer-description">
              Your trusted AI companion for orthopedic care guidance and support. 
              Empowering patients with evidence-based information and personalized recommendations.
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <Mail size={16} />
                <span>support@orthobotai.com</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="footer-section footer-links" variants={itemVariants}>
            <h4 className="footer-section-title">Quick Links</h4>
            <ul className="footer-nav">
              {footerLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="footer-link">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div className="footer-section footer-services" variants={itemVariants}>
            <h4 className="footer-section-title">Services</h4>
            <ul className="footer-nav">
              <li><a href="#post-op" className="footer-link">Post-Operative Care</a></li>
              <li><a href="#rehab" className="footer-link">Rehabilitation Plans</a></li>
              <li><a href="#symptoms" className="footer-link">Symptom Assessment</a></li>
              <li><a href="#medication" className="footer-link">Medication Guidance</a></li>
            </ul>
          </motion.div>

          <motion.div className="footer-section footer-social" variants={itemVariants}>
            <h4 className="footer-section-title">Follow Us</h4>
            <div className="social-links">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    className="social-link"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.name}
                  >
                    <IconComponent size={20} />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div className="footer-bottom" variants={itemVariants}>
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} OrthoBot AI. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#terms" className="footer-bottom-link">Terms of Service</a>
              <span className="footer-divider">|</span>
              <a href="#privacy" className="footer-bottom-link">Privacy Policy</a>
              <span className="footer-divider">|</span>
              <a href="#cookies" className="footer-bottom-link">Cookie Policy</a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;
