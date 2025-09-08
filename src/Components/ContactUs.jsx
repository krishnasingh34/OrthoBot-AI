import '../CSS/ContactUs.css';

const ContactUs = () => {
  return (
    <div className="contact-us page-container">
      {/* Header Section with background image */}
      <div className="contact-header">
        <div className="header-content">
          <h1>Contact Us</h1>
          <h2>Get in Touch with Dr. Rameshwar Kumar</h2>
        </div>
      </div>

      {/* Content Section matching provided layout */}
      <div className="contact-content">
        <div className="contact-container">
          {/* Top action cards */}
          <div className="contact-actions">
            <div className="action-card">
              <div className="action-icon orange">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.07 22 2 13.93 2 3a1 1 0 011-1h4.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/>
                </svg>
              </div>
              <div className="action-content">
                <h3>Call us</h3>
                <a href="tel:+917992271883">+917992271883</a>
              </div>
            </div>

            <div className="action-card">
              <div className="action-icon orange">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1.2 3.2l-6.3 4.2a1 1 0 01-1 0L5.2 7.2A1 1 0 016.2 6h11.6a1 1 0 01.999 1.2z"/>
                </svg>
              </div>
              <div className="action-content">
                <h3>Mail us</h3>
                <a href="mailto:care@drrameshwarkumar.in">care@drrameshwarkumar.in</a>
              </div>
            </div>
          </div>

          {/* Locations grid */}
          <div className="locations-grid">
            <div className="location-card">
              <a className="location-link" href="https://www.google.com/maps/place/Sri+Sai+Multispeciality+Hospital/@26.2304317,84.3679929,18z/data=!3m1!4b1!4m6!3m5!1s0x3992fd242aa6e8d3:0xc17a33d9ab8aad51!8m2!3d26.2304317!4d84.3692804!16s%2Fg%2F11h6rsgp9z" target="_blank" rel="noreferrer" aria-label="Open Sri Sai Multispeciality Hospital in Google Maps">
                <div className="location-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 12 7 12s7-6.75 7-12c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                  </svg>
                </div>
              </a>
              <a className="location-link" href="https://www.google.com/maps/place/Sri+Sai+Multispeciality+Hospital/@26.2304317,84.3679929,18z/data=!3m1!4b1!4m6!3m5!1s0x3992fd242aa6e8d3:0xc17a33d9ab8aad51!8m2!3d26.2304317!4d84.3692804!16s%2Fg%2F11h6rsgp9z" target="_blank" rel="noreferrer">
                <h4 className="location-title">Shreesai Hospital & Trauma Center Private Limited</h4>
              </a>
              <p className="location-address">Surgeon Lane, Bangali Pakri, Gaushala Road, Siwan, Bihar - 841226</p>
            </div>

            <div className="location-card">
              <a className="location-link" href="https://www.google.com/maps/place/Arya+Hospital/@28.617187,77.0768771,17z/data=!3m1!4b1!4m6!3m5!1s0x390d04c9e01ac373:0x551e8434294665d8!8m2!3d28.617187!4d77.079452!16s%2Fg%2F1tfm50_d" target="_blank" rel="noreferrer" aria-label="Open Arya Hospital in Google Maps">
                <div className="location-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 12 7 12s7-6.75 7-12c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                  </svg>
                </div>
              </a>
              <a className="location-link" href="https://www.google.com/maps/place/Arya+Hospital/@28.617187,77.0768771,17z/data=!3m1!4b1!4m6!3m5!1s0x390d04c9e01ac373:0x551e8434294665d8!8m2!3d28.617187!4d77.079452!16s%2Fg%2F1tfm50_d" target="_blank" rel="noreferrer">
                <h4 className="location-title">Delhi - Arya Hospital</h4>
              </a>
              <p className="location-address">C-1/101, Pankha Rd, Block C1, Janakpuri, Delhi, 110059</p>
            </div>

            <div className="location-card">
              <a className="location-link" href="https://www.google.com/maps/place/Dr.+Srishti+Shaumya+Hospital/@26.4602349,84.4384337,17z/data=!3m1!4b1!4m6!3m5!1s0x3993052cb4502477:0x3a3149fb7e8f7a73!8m2!3d26.4602349!4d84.4384337!16s%2Fg%2F11f50wykxt?entry=ttu&g_ep=EgoyMDI1MDgxNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer" aria-label="Open Dr. Srishti Shaumya Hospital in Google Maps">
                <div className="location-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 12 7 12s7-6.75 7-12c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                  </svg>
                </div>
              </a>
              <a className="location-link" href="https://www.google.com/maps/place/Dr.+Srishti+Shaumya+Hospital/@26.4602349,84.4384337,17z/data=!3m1!4b1!4m6!3m5!1s0x3993052cb4502477:0x3a3149fb7e8f7a73!8m2!3d26.4602349!4d84.4384337!16s%2Fg%2F11f50wykxt?entry=ttu&g_ep=EgoyMDI1MDgxNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer">
                <h4 className="location-title">Gopalganj - Dr. Srishti Soumya Hospital</h4>
              </a>
              <p className="location-address">Sai Krupa Complex, Near Bus Stand, Gopalganj, Bihar - 841428</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
