import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Dumbbell, 
  Stethoscope, 
  Pill,
  Shield,
  Clock
} from 'lucide-react';
import '../CSS/Features.css';

const Features = () => {
  const features = [
    {
      id: 1,
      title: "Post-Operative Care Guidance",
      description: "Comprehensive guidance for post-surgery recovery with personalized care instructions.",
      icon: Heart
    },
    {
      id: 2,
      title: "Exercise & Rehab Plans",
      description: "Customized rehabilitation exercises and physical therapy plans tailored to your needs.",
      icon: Dumbbell
    },
    {
      id: 3,
      title: "Symptom & Pain Check",
      description: "Regular symptom monitoring and pain assessment tools to track recovery progress.",
      icon: Stethoscope
    },
    {
      id: 4,
      title: "Medication Reminders & Instructions",
      description: "Smart medication scheduling with detailed instructions and dosage reminders.",
      icon: Pill
    },
    {
      id: 5,
      title: "24/7 Emergency Support",
      description: "Round-the-clock emergency assistance and immediate medical consultation access.",
      icon: Shield
    },
    {
      id: 6,
      title: "Appointment Scheduling",
      description: "Easy appointment booking and automated reminders for follow-up consultations.",
      icon: Clock
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 60 
    },
    visible: (index) => ({ 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    })
  };

  return (
    <section className="features-section" id="features">
      <div className="features-container">
        <motion.h2 
          className="features-title"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          What OrthoBot AI Offers
        </motion.h2>
        
        <motion.div 
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.id}
                className="feature-card"
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="feature-icon">
                  <IconComponent size={40} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
