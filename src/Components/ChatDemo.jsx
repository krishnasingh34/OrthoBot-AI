import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Mic,
  Search
} from 'lucide-react';
import '../CSS/ChatDemo.css';

const ChatDemo = () => {
  return (
    <section className="chat-demo" id="chat-demo">
      <ChatDemoContent />
    </section>
  );
};

const ChatDemoContent = () => {
  const [inputValue, setInputValue] = useState('');

  const popularQuestions = [
    "What exercises help with knee recovery?",
    "How long does shoulder surgery recovery take?",
    "Best practices for post-operative care",
    "When can I return to sports after injury?"
  ];

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // Redirect to chat page
      window.location.href = '/chat';
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleQuestionClick = (question) => {
    // Redirect to chat page with pre-filled question
    window.location.href = '/chat';
  };

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 100 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };


  return (
    <section className="chat-demo-section">
      <div className="chat-demo-container">
        <motion.h2 
          className="chat-demo-title"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Live Chatbox Demo
        </motion.h2>
        
        <motion.div 
          className="chat-interface-container"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Main Chat Input */}
          <motion.div 
            className="main-chat-input"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="search-icon">
              <Search size={24} />
            </div>
            <input
              type="text"
              placeholder="Ask about recovery, exercises, or treatment options..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="main-input"
            />
            <motion.button
              className="mic-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Mic size={20} />
            </motion.button>
            <motion.button
              className="send-button"
              onClick={handleSendMessage}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Send size={20} />
            </motion.button>
          </motion.div>

          {/* Popular Questions */}
          <div className="popular-questions-section">
            <h3 className="popular-questions-title">Popular questions:</h3>
            <div className="popular-questions-grid">
              {popularQuestions.map((question, index) => (
                <motion.button
                  key={index}
                  className="question-button"
                  onClick={() => handleQuestionClick(question)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  {question}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatDemo;
