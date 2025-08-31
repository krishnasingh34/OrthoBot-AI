import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Search, 
  CheckCircle 
} from 'lucide-react';
import '../CSS/HowItWorks.css';

const HowItWorks = () => {
  return (
    <section className="how-it-works" id="how-it-works">
      <HowItWorksContent />
    </section>
  );
};

const HowItWorksContent = () => {
  const steps = [
    {
      id: 1,
      number: "01",
      title: "Ask your question in the chat",
      description: "Simply type your orthopedic concern into our AI-powered chat interface. No complex forms required.",
      icon: MessageCircle,
      delay: 0.1
    },
    {
      id: 2,
      number: "02",
      title: "AI finds answers from orthopedic guidelines",
      description: "Our AI searches comprehensive medical guidelines and evidence-based resources for relevant information.",
      icon: Search,
      delay: 0.2
    },
    {
      id: 3,
      number: "03",
      title: "Get clear and structured advice instantly",
      description: "Receive personalized, easy-to-understand guidance based on current medical standards and practices.",
      icon: CheckCircle,
      delay: 0.3
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const stepVariants = {
    hidden: { 
      opacity: 0, 
      y: 80 
    },
    visible: (index) => ({ 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    })
  };

  return (
    <section className="how-it-works-section">
      <div className="how-it-works-container">
        <motion.h2 
          className="how-it-works-title"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          How to use OrthoBot AI 
        </motion.h2>
        
        <div className="steps-timeline-container">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div 
                key={step.id} 
                className="step-item"
                custom={index}
                variants={stepVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
                <div className="step-number-container">
                  <div className="step-number">{step.number}</div>
                  {index < steps.length - 1 && <div className="step-connector"></div>}
                </div>
                <motion.div 
                  className="step-card"
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: '0 15px 35px rgba(155, 81, 224, 0.2)',
                    borderColor: '#2D9CDB',
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className="step-icon">
                    <IconComponent size={32} />
                  </div>
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-description">{step.description}</p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
