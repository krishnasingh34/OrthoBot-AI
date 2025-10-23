import React, { useState, useEffect } from 'react';
import '../CSS/AboutUs.css';
import logoImage from '../assets/Dr_Logo.png';

const AboutUs = () => {
  const [achievements, setAchievements] = useState({
    years: 0,
    surgeries: 0, // Joint Replacement Surgery
    orthopedic: 0,
    consultations: 0
  });

  useEffect(() => {
    // Animate achievements counter
    const animateCounter = () => {
      const targetValues = {
        years: 18,
        surgeries: 20000,
        orthopedic: 20000,
        consultations: 700000
      };

      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepDuration = duration / steps;

      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        setAchievements({
          years: Math.floor(targetValues.years * progress),
          surgeries: Math.floor(targetValues.surgeries * progress),
          orthopedic: Math.floor(targetValues.orthopedic * progress),
          consultations: Math.floor(targetValues.consultations * progress)
        });

        if (currentStep >= steps) {
          clearInterval(timer);
          setAchievements(targetValues);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    };

    // Start animation after a short delay
    const timer = setTimeout(animateCounter, 500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize floating chat widget
  useEffect(() => {
    // Create floating chat button and iframe
    const createFloatingChat = () => {
      // Check if chat elements already exist
      if (document.getElementById('floating-chat-button')) return;

      // Get screen dimensions for responsive sizing
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Create floating chat button
      const chatButton = document.createElement('div');
      chatButton.id = 'floating-chat-button';
      chatButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      `;
      // Responsive button sizing
      let buttonSize, buttonBottom, buttonRight;
      
      if (screenWidth <= 480) {
        // Mobile phones - smaller button
        buttonSize = '50px';
        buttonBottom = '15px';
        buttonRight = '10px';
      } else if (screenWidth <= 768) {
        // Tablets - medium button
        buttonSize = '55px';
        buttonBottom = '18px';
        buttonRight = '20px';
      } else {
        // Desktop - full size button
        buttonSize = '60px';
        buttonBottom = '20px';
        buttonRight = '20px';
      }
      
      chatButton.style.cssText = `
        position: fixed;
        bottom: ${buttonBottom};
        right: ${buttonRight};
        width: ${buttonSize};
        height: ${buttonSize};
        background: linear-gradient(135deg, #FF3964, #85A9DB);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 57, 100, 0.3);
        z-index: 1000;
        transition: all 0.3s ease;
      `;

      // Create chat iframe container with responsive design
      const chatContainer = document.createElement('div');
      chatContainer.id = 'floating-chat-container';
      
      // Responsive dimensions based on screen size
      let chatWidth, chatHeight, bottomPos, rightPos;
      
      if (screenWidth <= 480) {
        // Mobile phones - full width with margins, avoid top cut-off
        chatWidth = Math.min(screenWidth - 20, 350);
        chatHeight = Math.min(screenHeight - 180, 400); // Reduced height to avoid top cut
        bottomPos = '90px';
        rightPos = '10px';
      } else if (screenWidth <= 768) {
        // Tablets - medium size with proper margins
        chatWidth = Math.min(screenWidth - 40, 380);
        chatHeight = Math.min(screenHeight - 200, 450); // Reduced height for tablets
        bottomPos = '90px';
        rightPos = '20px';
      } else {
        // Desktop - full size with safe margins
        chatWidth = 420;
        chatHeight = Math.min(screenHeight - 150, 550); // Ensure it doesn't exceed screen
        bottomPos = '90px';
        rightPos = '20px';
      }
      
      chatContainer.style.cssText = `
        position: fixed;
        bottom: ${bottomPos};
        right: ${rightPos};
        width: ${chatWidth}px;
        height: ${chatHeight}px;
        max-width: calc(100vw - 30px);
        max-height: calc(100vh - 180px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        z-index: 999;
        display: none;
        overflow: hidden;
      `;

      // // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = 'https://dr-rameshwar-appointment-gahmdwcjg2gjdwbh.centralindia-01.azurewebsites.net/webhook/8dfdf952-bc16-44c1-b436-709a0e94d524/chat';
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 12px;
      `;
      iframe.allow = 'microphone; camera; geolocation';
      iframe.title = 'Dr. Rameshwar AI Assistant';

      chatContainer.appendChild(iframe);

      // Add click event to toggle chat
      let isOpen = false;
      chatButton.addEventListener('click', () => {
        isOpen = !isOpen;
        chatContainer.style.display = isOpen ? 'block' : 'none';
        chatButton.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)';
      });

      // Add hover effects
      chatButton.addEventListener('mouseenter', () => {
        chatButton.style.transform = 'scale(1.1)';
      });
      
      chatButton.addEventListener('mouseleave', () => {
        chatButton.style.transform = isOpen ? 'rotate(45deg)' : 'scale(1)';
      });

      // Add window resize listener for dynamic responsiveness
      const handleResize = () => {
        const newScreenWidth = window.innerWidth;
        const newScreenHeight = window.innerHeight;
        
        // Update chat container dimensions
        let newChatWidth, newChatHeight, newBottomPos, newRightPos;
        let newButtonSize, newButtonBottom, newButtonRight;
        
        if (newScreenWidth <= 480) {
          // Mobile phones - avoid top cut-off
          newChatWidth = Math.min(newScreenWidth - 20, 350);
          newChatHeight = Math.min(newScreenHeight - 180, 400);
          newBottomPos = '90px';
          newRightPos = '10px';
          newButtonSize = '50px';
          newButtonBottom = '15px';
          newButtonRight = '10px';
        } else if (newScreenWidth <= 768) {
          // Tablets - proper margins
          newChatWidth = Math.min(newScreenWidth - 40, 380);
          newChatHeight = Math.min(newScreenHeight - 200, 450);
          newBottomPos = '90px';
          newRightPos = '20px';
          newButtonSize = '55px';
          newButtonBottom = '18px';
          newButtonRight = '20px';
        } else {
          // Desktop - safe margins
          newChatWidth = 420;
          newChatHeight = Math.min(newScreenHeight - 150, 550);
          newBottomPos = '90px';
          newRightPos = '20px';
          newButtonSize = '60px';
          newButtonBottom = '20px';
          newButtonRight = '20px';
        }
        
        // Update chat container styles
        chatContainer.style.width = `${newChatWidth}px`;
        chatContainer.style.height = `${newChatHeight}px`;
        chatContainer.style.bottom = newBottomPos;
        chatContainer.style.right = newRightPos;
        
        // Update button styles
        chatButton.style.width = newButtonSize;
        chatButton.style.height = newButtonSize;
        chatButton.style.bottom = newButtonBottom;
        chatButton.style.right = newButtonRight;
      };
      
      // Add resize event listener
      window.addEventListener('resize', handleResize);
      
      // Store resize handler for cleanup
      chatButton.resizeHandler = handleResize;

      // Append to body
      document.body.appendChild(chatButton);
      document.body.appendChild(chatContainer);
    };

    // Create floating chat after component mounts
    const timer = setTimeout(createFloatingChat, 1000);
    
    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      const button = document.getElementById('floating-chat-button');
      const container = document.getElementById('floating-chat-container');
      
      // Remove resize event listener
      if (button && button.resizeHandler) {
        window.removeEventListener('resize', button.resizeHandler);
      }
      
      if (button) button.remove();
      if (container) container.remove();
    };
  }, []);

  return (
    <div className="about-us page-container">
      {/* Header Section */}
      <div className="about-header">
        <div className="header-content" 
     style={{
       display: "flex",
       flexDirection: "column",
       alignItems: "center",  
       textAlign: "center",
       gap: "10px",
     }}
>
  <h1 
    style={{
      margin: "0",
      fontSize: "40px",
      fontWeight: "bold",
      color: "white",
    }}
  >
    About Us
  </h1>

  <h2 
    style={{
      marginTop: "5px",   
      fontSize: "20px",
      fontWeight: "normal",
      color: "white ",
    }}
  >
    Welcome to Dr. Rameshwar Kumar Clinic
  </h2>
</div>
      </div>

      {/* About Dr. Rameshwar Kumar Section */}
      <div className="about-section">
        <div className="about-container">
          <div className="about-content">
            <div className="about-text">
              <h3>ABOUT US</h3>
              <h4>Dr. Rameshwar Kumar</h4>
              <p className="qualifications">MBBS, MS, DNB, Mch (Ortho)</p>
              <p className="title">Orthopedic & Joint Replacement Surgeon</p>
              <p className="description">
                My name is Dr. Rameshwar Kumar orthopedic and joint replacement surgeon I have been practicing for over 18 years. I studied extensively and earned MBBS, MS, DNB, and Much (Ortho) degrees. I felt that there was still more I could do to help people suffering from knee pain.
              </p>
              <p className="description">
                One day, while meditating, I had a revelation. I realized that I could use my knowledge and the power of faith to help people heal without resorting to surgery or medications. I began developing a series of Miracle MP rituals that I believed could help alleviate knee pain.
              </p>
              <p className="description">
                I am the founder of <strong>Save The Knee Mission</strong>, which is dedicated to helping patients suffering from knee pain. My mission is to provide relief to patients without the need for surgery or the side effects of medications.
              </p>
            </div>
            <div className="about-image">
              <img src={logoImage} alt="Dr. Rameshwar Kumar" />
            </div>
          </div>
        </div>
      </div>

      {/* Know More Section */}
      <div className="know-more-section">
        <div className="know-more-container">
          <h3>Know More About Dr. Rameshwar Kumar</h3>
          <div className="know-more-content">
            <p>
              Over the years, I had performed more than <strong>20,000 orthopedic and joint replacement surgeries</strong>. But I knew that not everyone could afford such procedures. So, I decided to give back to my community by offering free orthopedic surgeries for poor people. I had done over <strong>150 such surgeries</strong>, and the patients were grateful for my help.
            </p>
            <p>
              I am passionate to help people and I did not stop there. I also trained more than <strong>7,000 health workers</strong> in first aid, and I conducted over <strong>300 health camps</strong> in villages. My dedication to patients had earned me a reputation as a compassionate and caring doctor.
            </p>
            <p>
              Despite my busy schedule, I always made time for consultations. I had given consultations to more than <strong>7 lakh patients</strong>, and my social media reach is over <strong>10 million people</strong>. My efforts had not gone unnoticed, and I had received numerous awards for my contributions to the medical field.
            </p>
            <p>
              I had found my life's purpose. I had dedicated my career to helping people in need and had made a real difference in the lives of countless patients. I hope it is inspired others to follow in my footsteps and make a positive impact on the world.
            </p>
            <div className="legal-info">
              <p>
                <strong>Dr. Rameshwar Kumar</strong> is a brand that runs under the name of Legal Entity <strong>Shreesai Hospital & Trauma Center Private Limited</strong> registered at the address <strong>Surgeon Lane, Bangaliu Pakri, Gaushala Road, Siwan, Bihar – 841226</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="achievements-section">
        <div className="achievements-container">
          <h3>Our Achievements</h3>
          <div className="achievements-grid">
            <div className="achievement-card">
              <div className="achievement-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"/>
                </svg>
              </div>
              <div className="achievement-number">{achievements.years}+</div>
              <div className="achievement-label">Years Experience</div>
            </div>
            
            <div className="achievement-card">
              <div className="achievement-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"/>
                </svg>
              </div>
              <div className="achievement-number">{achievements.surgeries.toLocaleString()}+</div>
              <div className="achievement-label">Joint Replacement Surgery</div>
            </div>
            
            <div className="achievement-card">
              <div className="achievement-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3M19 19H5V5H19V19M17 17H7V7H17V17M15 15H9V9H15V15Z"/>
                </svg>
              </div>
              <div className="achievement-number">{achievements.orthopedic.toLocaleString()}+</div>
              <div className="achievement-label">Orthopedic Surgery</div>
            </div>
            
            <div className="achievement-card">
              <div className="achievement-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4C16 5.11 15.11 6 14 6C12.89 6 12 5.11 12 4C12 2.89 12.89 2 14 2C15.11 2 16 2.89 16 4M20 22V16H22V22H20M22 13V11H20V13H22M10 4C10 5.11 9.11 6 8 6C6.89 6 6 5.11 6 4C6 2.89 6.89 2 8 2C9.11 2 10 2.89 10 4M13 22V16H11V22H13M13 13V11H11V13H13M4 22V16H6V22H4M6 13V11H4V13H6Z"/>
                </svg>
              </div>
              <div className="achievement-number">{achievements.consultations.toLocaleString()}+</div>
              <div className="achievement-label">Consultations</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AboutUs;
