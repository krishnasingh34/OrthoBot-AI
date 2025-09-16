import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Phone, X } from 'lucide-react';
import '../CSS/VoiceCallingInterface.css';

const VoiceCallingInterface = ({ isOpen, onClose, selectedLanguage = 'en' }) => {
  const [isListening, setIsListening] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('english');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isWelcomeSpoken, setIsWelcomeSpoken] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, error
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const conversationHistoryRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isShuttingDownRef = useRef(false);

  // Helper to track and clear timeouts to avoid delayed restarts
  const addTimeout = (callback, delay) => {
    if (isShuttingDownRef.current) return null;
    const id = setTimeout(() => {
      if (!isShuttingDownRef.current) {
        callback();
      }
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  const clearAllTimeouts = () => {
    if (timeoutsRef.current.length) {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    }
  };

  // Get welcome message from backend
  const getWelcomeMessage = async (language) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/greeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.greeting;
      }
    } catch (error) {
      console.error('Error fetching welcome message:', error);
    }
    
    // Fallback messages
    const fallbackMessages = {
      hindi: "हैलो! मैं OrthoBot हूं। मैं आपकी orthopedic recovery में help करने के लिए यहां हूं। आपको क्या problem है?",
      english: "Hello! I'm OrthoBot AI, your orthopedic recovery assistant. I'm here to help you with your post-operative recovery journey. What can I help you with today?",
      hinglish: "हैलो! मैं OrthoBot हूं। मैं आपकी orthopedic recovery में help करने के लिए यहां हूं। आपको क्या problem है?"
    };
    
    return fallbackMessages[language] || fallbackMessages.english;
  };

  // Start voice session
  const startVoiceSession = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/voice/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'voice-call-user',
          sessionType: 'voice_call'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.sessionId);
        console.log('Voice session started:', data.sessionId);
        return data.sessionId;
      } else {
        throw new Error('Failed to start voice session');
      }
    } catch (error) {
      console.error('Error starting voice session:', error);
      return null;
    }
  };

  // End voice session
  const endVoiceSession = async (sessionId) => {
    if (!sessionId) return;
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/voice/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Voice session ended:', data);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Error ending voice session:', error);
    }
  };

  // Get bot response and speak it
  const getBotResponseAndSpeak = async (userMessage, language) => {
    try {
      setIsBotSpeaking(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      
      const response = await fetch(`${backendUrl}/askAI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          userId: 'voice-call-user',
          useConversationalAgent: true,
          source: 'voice',
          sessionId: currentSessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botResponse = data.response || data.answer || 'Sorry, I could not process your request.';
        
        // Store in conversation history
        conversationHistoryRef.current.push({
          user: userMessage,
          bot: botResponse,
          timestamp: new Date()
        });
        
        // Speak the response and wait for it to complete
        await speakText(botResponse, language);
      } else {
        throw new Error('Failed to get bot response');
      }
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMessage = language === 'hindi' ? 
        'माफ करें, मुझे कुछ तकनीकी समस्या हो रही है। कृपया थोड़ी देर बाद कोशिश करें।' :
        'I\'m sorry, I\'m experiencing some technical difficulties. Please try again in a moment.';
      await speakText(errorMessage, language);
    }
    // Note: setIsBotSpeaking(false) is handled in speakText function
  };

  // Speak text using TTS
  const speakText = async (text, language) => {
    if (!window.speechSynthesis) return;
    
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language for TTS
      if (language === 'hindi' || language === 'hinglish') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.onstart = () => {
        setIsBotSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsBotSpeaking(false);
        resolve();
      };
      
      utterance.onerror = () => {
        setIsBotSpeaking(false);
        resolve();
      };
      
      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  };

  // Detect language from text
  const detectLanguage = (text) => {
    const hindiPattern = /[\u0900-\u097F]/; // Devanagari script
    const englishPattern = /^[a-zA-Z\s.,!?'"()-]+$/;
    
    const hasHindi = hindiPattern.test(text);
    const hasEnglish = englishPattern.test(text);
    
    if (hasHindi && hasEnglish) return 'hinglish';
    if (hasHindi) return 'hindi';
    return 'english';
  };

  // Speak welcome message
  const speakWelcomeMessage = async (language) => {
    try {
      // Start voice session first
      const sessionId = await startVoiceSession();
      if (!sessionId) {
        throw new Error('Failed to start voice session');
      }
      
      const message = await getWelcomeMessage(language);
      setConnectionStatus('connected');
      
      await speakText(message, language);
      
      setIsWelcomeSpoken(true);
      setConversationActive(true);
      
      // Start listening after welcome message
      addTimeout(() => {
        startListening();
      }, 500);
    } catch (error) {
      console.error('Error speaking welcome message:', error);
      setConnectionStatus('error');
    }
  };

  // Start voice recognition
  const startListening = () => {
    try {
      if (isShuttingDownRef.current) return;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      // Set language based on selected language from Chat component
      if (selectedLanguage === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-US';
      }
      
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      setIsListening(true);

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Store final transcript for later use
        recognition.finalTranscript = finalTranscript;

        // Update detected language based on what user says
        const userText = finalTranscript || interimTranscript;
        if (userText.trim()) {
          const newLanguage = detectLanguage(userText);
          if (newLanguage !== detectedLanguage) {
            setDetectedLanguage(newLanguage);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Restart listening for most errors, except aborted
        if (event.error !== 'aborted' && isOpen && conversationActive) {
          addTimeout(() => {
            if (isOpen && conversationActive) {
              console.log('Restarting listening after error:', event.error);
              startListening();
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('Recognition ended, final transcript:', recognition.finalTranscript);
        
        // If we have final transcript, get bot response and continue conversation
        if (!isShuttingDownRef.current && recognition && recognition.finalTranscript && recognition.finalTranscript.trim()) {
          const userMessage = recognition.finalTranscript.trim();
          const currentLanguage = selectedLanguage === 'hi' ? 'hindi' : 'english';
          
          console.log('Processing user message:', userMessage);
          
          // Get bot response and speak it
          getBotResponseAndSpeak(userMessage, currentLanguage).then(() => {
            console.log('Bot finished speaking, restarting listening...');
            // After bot finishes speaking, start listening again
            if (!isShuttingDownRef.current && isOpen && conversationActive) {
              addTimeout(() => {
                console.log('Starting listening again...');
                startListening();
              }, 1500); // Increased delay to ensure bot has finished
            }
          }).catch((error) => {
            console.error('Error in bot response chain:', error);
            // Even if there's an error, try to restart listening
            if (!isShuttingDownRef.current && isOpen && conversationActive) {
              addTimeout(() => {
                startListening();
              }, 2000);
            }
          });
        } else {
          console.log('No final transcript, restarting listening...');
          // Restart listening if no final result
          addTimeout(() => {
            if (!isShuttingDownRef.current && isOpen && conversationActive) {
              startListening();
            }
          }, 1000);
        }
      };

      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };

  // Initialize calling interface
  useEffect(() => {
    if (isOpen) {
      console.log('Voice interface opening - initializing fresh state');
      isShuttingDownRef.current = false;
      
      // Ensure clean state
      setConnectionStatus('connecting');
      setIsWelcomeSpoken(false);
      setIsListening(false);
      setIsBotSpeaking(false);
      setConversationActive(false);
      
      // Clear any existing recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (error) {
          console.log('Error stopping existing recognition:', error);
        }
        recognitionRef.current = null;
      }
      
      // Clear any existing speech synthesis
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
        speechSynthesisRef.current = null;
      }
      
      // Simulate connection delay
      addTimeout(async () => {
        // Use the selected language from Chat component
        const initialLanguage = selectedLanguage === 'hi' ? 'hindi' : 'english';
        setDetectedLanguage(initialLanguage);
        
        // Speak welcome message in the selected language
        await speakWelcomeMessage(initialLanguage);
      }, 1000);
    }
  }, [isOpen, selectedLanguage]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      console.log('Voice interface closed - cleaning up all audio');
      isShuttingDownRef.current = true;
      
      // End voice session if it exists
      if (currentSessionId) {
        endVoiceSession(currentSessionId);
      }
      
      // Clear any scheduled timeouts
      clearAllTimeouts();

      // Completely stop and destroy speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (error) {
          console.log('Error stopping recognition in cleanup:', error);
        }
        recognitionRef.current = null;
      }
      
      // Stop speech synthesis
      window.speechSynthesis.cancel();
      speechSynthesisRef.current = null;
      
      // Reset all states
      setIsListening(false);
      setIsWelcomeSpoken(false);
      setConnectionStatus('connecting');
      setConversationActive(false);
      setIsBotSpeaking(false);
      setCurrentSessionId(null);
      
      // Clear conversation history
      conversationHistoryRef.current = [];
    }
  }, [isOpen]);

  // Fallback mechanism to ensure conversation continues
  useEffect(() => {
    if (isOpen && conversationActive && !isListening && !isBotSpeaking && isWelcomeSpoken) {
      console.log('Fallback: Starting listening due to inactive state');
      const timer = addTimeout(() => {
        if (isOpen && conversationActive && !isListening && !isBotSpeaking) {
          startListening();
        }
      }, 3000); // 3 second fallback
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, conversationActive, isListening, isBotSpeaking, isWelcomeSpoken]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('Voice interface component unmounting - final cleanup');
      // Final cleanup when component is destroyed
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (error) {
          console.log('Error in final cleanup:', error);
        }
        recognitionRef.current = null;
      }
      
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
        speechSynthesisRef.current = null;
      }
    };
  }, []);

  // Handle end call
  const handleEndCall = () => {
    console.log('Ending call - stopping all audio and recognition');
    isShuttingDownRef.current = true;

    // Stop any scheduled restarts/timeouts immediately
    clearAllTimeouts();

    // Stop all audio and conversation immediately
    setConversationActive(false);
    setIsListening(false);
    setIsBotSpeaking(false);

    // Completely stop and destroy speech recognition immediately
    if (recognitionRef.current) {
      try {
        // Remove handlers to avoid any retries or restarts
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        // Abort first to force immediate termination in some browsers
        recognitionRef.current.abort();
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Error stopping recognition:', error);
      }
      recognitionRef.current = null;
    }

    // Stop speech synthesis immediately
    window.speechSynthesis.cancel();
    speechSynthesisRef.current = null;

    // Clear conversation history
    conversationHistoryRef.current = [];

    // Close modal immediately without waiting for backend
    onClose();

    // End voice session in background (non-blocking)
    if (currentSessionId) {
      endVoiceSession(currentSessionId);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="voice-calling-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="voice-calling-interface"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Close button */}
          <button className="close-btn" onClick={handleEndCall}>
            <X size={20} />
          </button>

          {/* Connection status */}
          <div className="connection-status">
            {connectionStatus === 'connecting' && (
              <div className="status-text">Connecting...</div>
            )}
            {connectionStatus === 'connected' && conversationActive && (
              <div className="status-text">Conversation Active</div>
            )}
            {connectionStatus === 'connected' && !conversationActive && (
              <div className="status-text">Connected</div>
            )}
            {connectionStatus === 'error' && (
              <div className="status-text error">Connection Error</div>
            )}
          </div>

          {/* Main calling interface */}
          <div className="calling-main">
            {/* Listening indicator */}
            <div className="listening-indicator">
              <motion.div
                className={`listening-circle ${isListening ? 'active' : ''}`}
                animate={isListening ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: isListening ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <div className="inner-circle">
                  {isListening ? (
                    <motion.div
                      className="listening-text"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      Listening...
                    </motion.div>
                  ) : isBotSpeaking ? (
                    <div className="bot-speaking-text">
                      Bot is speaking...
                    </div>
                  ) : (
                    <div className="waiting-text">
                      {isWelcomeSpoken ? 'Speak now...' : 'Connecting...'}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* End call button */}
            <motion.button
              className="end-call-btn"
              onClick={handleEndCall}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Phone size={24} />
              End Call
            </motion.button>
          </div>

          {/* Disclaimer */}
          <div className="calling-disclaimer">
            <p>OrthoBot AI can sometimes make mistakes. Always consult with a doctor for medical advice.</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceCallingInterface;