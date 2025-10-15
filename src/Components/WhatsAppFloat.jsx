import React from 'react';
import './WhatsAppFloat.css';

const WhatsAppFloat = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = '917992271883';
    const message = 'Hello! I want to know more about OrthoBot AI and your orthopedic recovery services.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="whatsapp-float" onClick={handleWhatsAppClick} aria-label="Chat on WhatsApp">
      <i className="fab fa-whatsapp"></i>
    </div>
  );
};

export default WhatsAppFloat;
