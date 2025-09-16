import React from 'react';
import '../CSS/PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-page page-container">
      {/* Header Section with background image */}
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
  Privacy Policy
  </h1>

  <h2 
    style={{
      marginTop: "5px",   
      fontSize: "20px",
      fontWeight: "normal",
      color: "white ",
    }}
  >
  We respect your privacy
  </h2>
</div>
      </div>

      {/* Content Section */}
      <div className="privacy-content">
        <div className="privacy-container">
          <h2 className="page-title">Privacy Policy</h2>
          <h3>Introduction:</h3>
          <p>
            We value the privacy of our users and are committed to protecting their personal
            information. This Privacy Policy describes what information we collect, how we use it,
            and the steps we take to ensure that it is protected.
          </p>

          <h3>Information Collection:</h3>
          <p>
            We collect information that is necessary to provide our services, such as name, email
            address, and payment information. We may also collect information about your location,
            device type, and IP address. We may use cookies, log files, and other technologies to
            collect this information.
          </p>

          <h3>Information Use:</h3>
          <p>
            We use the information we collect to provide and improve our services, to personalize
            your experience, and to communicate with you. We may also use your information to send
            you marketing and promotional materials, but only with your consent.
          </p>

          <h3>Information Sharing:</h3>
          <p>
            We do not sell or share your personal information with third parties, except in the
            following circumstances:
          </p>
          <ul className="privacy-bullets">
            <li>With your consent</li>
            <li>To comply with the law or respond to legal process</li>
            <li>To protect the rights, property, or safety of our company, employees, customers, or others</li>
          </ul>

          <h3>Information Security:</h3>
          <p>
            We take appropriate security measures to protect your personal information from
            unauthorized access, disclosure, alteration, or destruction. This includes encryption,
            firewalls, and secure storage. However, no security measures are perfect, and we cannot
            guarantee the absolute security of your information.
          </p>

          <h3>Changes to Privacy Policy:</h3>
          <p>
            We may update this Privacy Policy from time to time. If we make any significant
            changes, we will notify you through our website or by email.
          </p>

          <h3>Contact Us:</h3>
          <p>
            If you have any questions or concerns about our Privacy Policy, please contact us at
            <strong> 7992271883</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;


