import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { useClerk, useUser } from '@clerk/clerk-react';
import '../CSS/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  // const { isSignedIn } = useUser();
  // const { openSignIn } = useClerk();

  const handleNavigation = (path) => {
    // Navigate first
    navigate(path);
    // Smooth scroll to top after route change
    if (path === '/' || path === '/about' || path === '/contact' || path === '/privacy-policy' || path === '/terms-conditions') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleFooterLoginClick = () => {
    if (!isSignedIn) {
      // Scroll to top smoothly, then open Clerk sign-in modal once at top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      let modalOpened = false;

      const tryOpenModal = () => {
        if (!modalOpened && (window.scrollY === 0 || window.pageYOffset === 0)) {
          modalOpened = true;
          window.removeEventListener('scroll', tryOpenModal, { passive: true });
          openSignIn({});
        }
      };

      // Listen for scroll to reach the top
      window.addEventListener('scroll', tryOpenModal, { passive: true });

      // Fallback in case the browser doesn't emit final scroll event
      setTimeout(() => {
        if (!modalOpened) {
          modalOpened = true;
          window.removeEventListener('scroll', tryOpenModal, { passive: true });
          openSignIn({});
        }
      }, 900);
      return;
    }

    // If already signed in → go to Home, then smoothly scroll all the way to the very top
    navigate('/');
    setTimeout(() => {
      // Initiate smooth scroll to absolute top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const onScrollCheckTop = () => {
        if (window.scrollY === 0 || window.pageYOffset === 0) {
          window.removeEventListener('scroll', onScrollCheckTop, { passive: true });
        }
      };

      // Keep listening until we reach the very top
      window.addEventListener('scroll', onScrollCheckTop, { passive: true });

      // Fallback: try once more shortly after in case route transition repositioned
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 350);

      // Cleanup the listener after a reasonable window
      setTimeout(() => {
        window.removeEventListener('scroll', onScrollCheckTop, { passive: true });
      }, 1200);
    }, 200);
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Branding - left column */}
          <div className="footer-branding">
            <h3 className="footer-logo">OrthoBot AI</h3>
            <p className="footer-tagline">Smart Recovery Assistant</p>
            <p className="footer-description">
            Your trusted AI companion for orthopedic care guidance and support. 
            Empowering patients with evidence-based information and personalized recommendations.
            </p>

            {/* Social icons placed under branding description */}
            <div className="social-icons branding-social">
              <a href="https://www.linkedin.com/in/lions-mjf-dr-rameshwar-kumar-b2b800150/" className="social-icon linkedin" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/drrameshwarkumar" className="social-icon facebook" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/drrameshwarkumar/?igshid=MmU2YjMzNjRlOQ%3D%3D" className="social-icon instagram" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@DrRameshwarkumar" className="social-icon youtube" aria-label="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links - middle column */}
          <div className="footer-links">
            <h4 className="footer-section-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li><button onClick={() => handleNavigation('/')} className="footer-link">Home</button></li>
              <li><button onClick={() => handleNavigation('/about')} className="footer-link">About Us</button></li>
              <li><button onClick={() => handleNavigation('/contact')} className="footer-link">Contact Us</button></li>
              <li><button onClick={handleFooterLoginClick} className="footer-link">Login</button></li>
              <li><button onClick={() => handleNavigation('/privacy-policy')} className="footer-link">Privacy Policy</button></li>
              <li><button onClick={() => handleNavigation('/terms-conditions')} className="footer-link">Terms & Conditions</button></li>
            </ul>
          </div>

          {/* Contact Us - right column */}
          <div className="footer-contact">
            <h4 className="footer-section-title">Contact Us</h4>
            <ul className="contact-list">
              <li className="contact-item">
                <span className="contact-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C7.589 2 4 5.589 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.411-3.589-8-8-8zm0 10.5c-1.933 0-3.5-1.567-3.5-3.5S10.067 5.5 12 5.5s3.5 1.567 3.5 3.5S13.933 12.5 12 12.5z"/>
                  </svg>
                </span>
                <span className="contact-text">
                  C-1/101, Pankha Rd, Block C1, Janakpuri, Delhi, 110059
                </span>
              </li>
              {/* Phone number */}
              <li className="contact-item">
                <a className="contact-icon" href="tel:+917992271883" aria-label="Call +91 79922 71883">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.07 22 2 13.93 2 3a1 1 0 011-1h4.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/>
                  </svg>
                </a>
                <a className="contact-link" href="tel:+917992271883">+91 79922 71883</a>
              </li>
                             {/* WhatsApp number */}
               <li className="contact-item">
                 <a className="contact-icon" href="https://wa.me/917992271883" aria-hidden="true" target="_blank">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">         {/* WhatsApp speech bubble background */}
                     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                   </svg>
                 </a>
                 <a className="contact-link" href="https://wa.me/917992271883" target="_blank" rel="noreferrer">+91 79922 71883</a>
               </li>
              {/* Email */}
              <li className="contact-item">
                <a className="contact-icon" href="mailto:care@drrameshwarkumar.in" aria-label="Email care@drrameshwarkumar.in">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1.2 3.2l-6.3 4.2a1 1 0 01-1 0L5.2 7.2A1 1 0 016.2 6h11.6a1 1 0 01.999 1.2z"/>
                  </svg>
                </a>
                <a className="contact-link" href="mailto:care@drrameshwarkumar.in">care@drrameshwarkumar.in</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} OrthoBot AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


