import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import '../CSS/FAQ.css';

const FAQ = () => {
  return (
    <section className="faq" id="faqs">
      <FAQContent />
    </section>
  );
};

const FAQContent = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "Is OrthoBot AI a replacement for doctors?",
      answer: "No, OrthoBot AI is designed as a support tool to complement professional medical care, not replace it. It provides evidence-based guidance and information to help you understand orthopedic conditions and treatments. Always consult with qualified healthcare professionals for diagnosis, treatment decisions, and medical emergencies."
    },
    {
      id: 2,
      question: "Can I use it for any orthopedic condition?",
      answer: "Yes, OrthoBot AI covers a wide range of orthopedic conditions including joint problems, bone injuries, muscle strains, post-surgical care, and rehabilitation guidance. However, it's specifically limited to orthopedic care guidance only and doesn't provide advice for other medical specialties or emergency situations."
    },
    {
      id: 3,
      question: "Is my data safe?",
      answer: "Absolutely. We prioritize your privacy and security above all else. All conversations are encrypted, your personal health information is protected according to healthcare privacy standards, and we never share your data with third parties. Your trust is essential to us, and we maintain the highest standards of data protection."
    },
    {
      id: 4,
      question: "How accurate is the medical information provided?",
      answer: "OrthoBot AI is trained on current medical literature, evidence-based guidelines, and peer-reviewed research in orthopedic medicine. While we strive for high accuracy, medical situations can be complex and individual. Always verify important medical decisions with your healthcare provider."
    },
    {
      id: 5,
      question: "Can I use OrthoBot for emergency situations?",
      answer: "No, OrthoBot AI is not designed for medical emergencies. If you're experiencing severe pain, trauma, signs of infection, or any urgent medical situation, please seek immediate medical attention by calling emergency services or visiting your nearest emergency room."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
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
    <section className="faq-section">
      <div className="faq-container">
        <motion.h2 
          className="faq-title"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Frequently Asked Questions (FAQs)
        </motion.h2>
        
        <motion.div 
          className="faq-list"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              className="faq-item"
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <div 
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                <h3>{faq.question}</h3>
                <motion.div
                  className="faq-icon"
                  animate={{ 
                    rotate: openIndex === index ? 180 : 0 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={24} />
                </motion.div>
              </div>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    className="faq-answer"
                    initial={{ 
                      height: 0, 
                      opacity: 0 
                    }}
                    animate={{ 
                      height: "auto", 
                      opacity: 1 
                    }}
                    exit={{ 
                      height: 0, 
                      opacity: 0 
                    }}
                    transition={{ 
                      duration: 0.4,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="faq-answer-content">
                      <p>{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
