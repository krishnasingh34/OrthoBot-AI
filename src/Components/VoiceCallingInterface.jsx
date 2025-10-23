import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Phone, X } from 'lucide-react';
import '../CSS/VoiceCallingInterface.css';

const VoiceCallingInterface = ({ isOpen, onClose, selectedLanguage = 'en', onSaveVoiceHistory }) => {
  const [isListening, setIsListening] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('english');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isWelcomeSpoken, setIsWelcomeSpoken] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, error
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const currentSessionIdRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const azureAudioRef = useRef(null);
  const azureAudioUrlRef = useRef(null);
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
        currentSessionIdRef.current = data.sessionId;
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
          sessionId: currentSessionIdRef.current || currentSessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Sync sessionId from backend (in case server ensured/created a different one)
        if (data.sessionId && data.sessionId !== currentSessionIdRef.current) {
          setCurrentSessionId(data.sessionId);
          currentSessionIdRef.current = data.sessionId;
        }
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

  // Speak text using Azure TTS
  const speakText = async (text, language) => {
    const useAzureTTS = import.meta.env.VITE_USE_AZURE_TTS === 'true';
    const azureKey = import.meta.env.VITE_AZURE_KEY;
    const azureRegion = import.meta.env.VITE_AZURE_REGION;
    const voice = 'hi-IN-AartiNeural'; // Use same voice for all languages
    
    setIsBotSpeaking(true);

    console.log('🎤 Azure TTS Debug:', { 
      useAzureTTS, 
      language, 
      voice,
      text: text.substring(0, 50) + '...' 
    });

    // Use Azure Speech Services TTS
    if (useAzureTTS && azureKey && azureRegion) {
      try {
        // Get Azure token
        const tokenResp = await fetch(`https://${azureRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
          method: "POST",
          headers: { "Ocp-Apim-Subscription-Key": azureKey }
        });
        
        if (!tokenResp.ok) {
          throw new Error(`Token request failed: ${tokenResp.status}`);
        }
        
        const token = await tokenResp.text();

        // Create SSML
        const ssml = `
          <speak version='1.0' xml:lang='hi-IN'>
            <voice name='${voice}'>${text}</voice>
          </speak>`;

        // Get TTS audio
        const ttsResp = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3"
          },
          body: ssml
        });

        if (!ttsResp.ok) {
          throw new Error(`Azure TTS failed: ${ttsResp.status}`);
        }
        
        const audioBlob = await ttsResp.blob();
        const url = URL.createObjectURL(audioBlob);

        // Clean up previous audio
        if (azureAudioRef.current) {
          try { azureAudioRef.current.pause(); } catch {}
        }
        if (azureAudioUrlRef.current) {
          try { URL.revokeObjectURL(azureAudioUrlRef.current); } catch {}
        }

        // Store references
        azureAudioUrlRef.current = url;
        const audio = new Audio(url);
        azureAudioRef.current = audio;

        // Play audio and wait for completion
        return new Promise((resolve) => {
          audio.onended = () => {
            console.log('🎵 Azure TTS Ended');
            setIsBotSpeaking(false);
            URL.revokeObjectURL(url);
            azureAudioRef.current = null;
            azureAudioUrlRef.current = null;
            resolve();
          };
          
          audio.onerror = (error) => {
            console.error('🚨 Azure TTS Audio Error:', error);
            setIsBotSpeaking(false);
            URL.revokeObjectURL(url);
            azureAudioRef.current = null;
            azureAudioUrlRef.current = null;
            resolve();
          };
          
          console.log('🎵 Azure TTS Started');
          audio.play().catch((error) => {
            console.error('🚨 Azure TTS Play Error:', error);
            setIsBotSpeaking(false);
            URL.revokeObjectURL(url);
            azureAudioRef.current = null;
            azureAudioUrlRef.current = null;
            resolve();
          });
        });
      } catch (err) {
        console.error("Azure TTS failed:", err);
        setIsBotSpeaking(false);
        // Fall back to browser TTS
      }
    }

    // Fallback to browser speechSynthesis
    console.log('🎤 Falling back to browser TTS');
    if (!window.speechSynthesis) {
      setIsBotSpeaking(false);
      return;
    }
    
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (language === 'hindi' || language === 'hinglish') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-IN';
      }
      
      utterance.onstart = () => {
        setIsBotSpeaking(true);
        console.log('🎵 Browser TTS Started');
      };
      
      utterance.onend = () => { 
        setIsBotSpeaking(false); 
        console.log('🎵 Browser TTS Ended');
        resolve(); 
      };
      
      utterance.onerror = (error) => { 
        setIsBotSpeaking(false); 
        console.error('🚨 Browser TTS Error:', error);
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
      // Stop any ongoing Azure audio playback
      if (azureAudioRef.current) {
        try { azureAudioRef.current.pause(); } catch {}
        azureAudioRef.current = null;
      }
      if (azureAudioUrlRef.current) {
        try { URL.revokeObjectURL(azureAudioUrlRef.current); } catch {}
        azureAudioUrlRef.current = null;
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

  // Save voice conversation to chat history
  const saveVoiceConversationToHistory = async (sessionId) => {
    if (!sessionId || !onSaveVoiceHistory) return;
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/voice/session/history`, {
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
        console.log('Voice session history retrieved:', data);
        
        // Convert voice conversation to chat format
        if (data.conversationHistory && data.conversationHistory.length > 0) {
          const chatMessages = data.conversationHistory.map((msg, index) => ({
            id: Date.now() + index,
            type: msg.role === 'user' ? 'user' : 'bot',
            text: msg.content,
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          
          // Generate chat title based on first few user messages for better intent detection
          const userMessages = data.conversationHistory
            .filter(msg => msg.role === 'user')
            .slice(0, 3)
            .map(msg => msg.content)
            .join(' ');
          
          const chatTitle = userMessages ? 
            extractVoiceCallIntent(userMessages) : 
            'General Conversations';
          
          // Save to chat history via callback
          onSaveVoiceHistory(chatMessages, chatTitle);
          console.log('Voice conversation saved to chat history:', chatTitle);
        }
      }
    } catch (error) {
      console.error('Error saving voice conversation to history:', error);
    }
  };

  // Extract intent from voice call for chat title
  const extractVoiceCallIntent = (text) => {
    const cleanText = text.toLowerCase().trim();
    console.log('🎯 Analyzing text for intent:', cleanText);
    console.log('🎯 Text length:', cleanText.length);
    
    // Intent patterns for meaningful chat titles (without "Voice Call:" prefix)
    const intentPatterns = {
      'Post-operative Care': ['post-operative', 'post operative', 'after surgery', 'post surgery', 'operation ke baad', 'surgery ke baad', 'सर्जरी के बाद', 'ऑपरेशन के बाद', 'surgery baad', 'operation baad'],
      'Knee Recovery': ['knee', 'knee pain', 'knee surgery', 'knee injury', 'घुटना', 'घुटने में दर्द', 'ghutna', 'knee ka dard'],
      'Back Pain Relief': ['back pain', 'back injury', 'back surgery', 'spine', 'कमर दर्द', 'पीठ दर्द', 'kamar dard', 'back mein dard'],
      'Shoulder Rehabilitation': ['shoulder', 'shoulder pain', 'shoulder surgery', 'shoulder injury', 'कंधा', 'कंधे में दर्द', 'kandha'],
      'Hip Recovery': ['hip', 'hip replacement', 'hip surgery', 'hip pain', 'कूल्हा', 'कूल्हे में दर्द', 'kulha'],
      'Exercise & Therapy': ['exercise', 'workout', 'physical therapy', 'stretching', 'व्यायाम', 'एक्सरसाइज', 'physio'],
      'Recovery Timeline': ['recovery time', 'how long', 'timeline', 'healing time', 'कितना समय', 'कब तक', 'kitna samay'],
      'Pain Management': ['pain relief', 'manage pain', 'reduce pain', 'pain medication', 'दर्द कम करना', 'dard kam karna'],
      'Mobility Issues': ['mobility', 'movement', 'range of motion', 'flexibility', 'चलने में', 'हिलने में', 'chalne mein'],
      'Wound Care': ['wound', 'incision', 'stitches', 'healing', 'घाव', 'टांके', 'ghav', 'tanke'],
      'Return to Activities': ['return to work', 'return to sport', 'normal activities', 'काम पर वापस', 'kaam par wapas'],
      'Diabetes Management': ['diabetes', 'sugar', 'blood sugar', 'glucose', 'insulin', 'शुगर', 'मधुमेह', 'डायबिटीज'],
      'Blood Pressure Issues': ['blood pressure', 'bp high', 'bp low', 'hypertension', 'ब्लड प्रेशर', 'हाई बीपी'],
      'Heart Problems': ['heart', 'chest pain', 'heart attack', 'cardiac', 'दिल', 'सीने में दर्द', 'heart attack'],
      'Breathing Issues': ['breathing', 'asthma', 'cough', 'lungs', 'सांस', 'खांसी', 'दम घुटना', 'saas'],
      'Mental Health': ['depression', 'anxiety', 'stress', 'तनाव', 'चिंता', 'डिप्रेशन', 'tanav'],
      'General Health': ['health', 'wellness', 'checkup', 'स्वास्थ्य', 'सेहत', 'swasthya']
    };
    
    // Find matching intent for medical topics
    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      const matchedKeyword = keywords.find(keyword => cleanText.includes(keyword));
      if (matchedKeyword) {
        console.log('✅ Found medical intent match:', intent, 'for keyword:', matchedKeyword);
        return intent;
      }
    }
    console.log('❌ No specific medical intent matches found');
    
    // Fallback: extract key medical terms and create meaningful titles
    const medicalTerms = {
      'surgery': 'Surgery Consultation',
      'सर्जरी': 'Surgery Consultation',
      'ऑपरेशन': 'Surgery Consultation',
      'recovery': 'Recovery Questions', 
      'pain': 'Pain Relief',
      'therapy': 'Therapy Guidance',
      'exercise': 'Exercise Questions',
      'treatment': 'Treatment Discussion',
      'injury': 'Injury Consultation',
      'healing': 'Healing Process',
      'medicine': 'Medication Questions',
      'doctor': 'Medical Consultation',
      'hospital': 'Hospital Related',
      'दर्द': 'Pain Relief',
      'इलाज': 'Treatment Discussion',
      'दवा': 'Medication Questions',
      'डॉक्टर': 'Medical Consultation'
    };
    
    for (const [term, title] of Object.entries(medicalTerms)) {
      if (cleanText.includes(term)) {
        console.log('✅ Found medical term match:', title, 'for term:', term);
        return title;
      }
    }
    console.log('❌ No medical term matches found');
    // Check for non-medical/off-topic conversations
    const offTopicPatterns = {
      'Weather Discussion': [
        'weather', 'rain', 'hot', 'cold', 'temperature',
        'मौसम', 'बारिश', 'गर्मी', 'ठंड', 'mausam'
      ],
    
      'Technology Talk': [
        'computer', 'phone', 'internet', 'software', 'app', 'website',
        'कंप्यूटर', 'फोन', 'इंटरनेट'
      ],
    
      'Food & Cooking': [
        'food', 'cooking', 'recipe', 'eat', 'meal',
        'खाना', 'खाना बनाना', 'रेसिपी', 'khana'
      ],
    
      'Sports Discussion': [
        'cricket', 'football', 'sports', 'match', 'game',
        'खेल', 'मैच', 'क्रिकेट', 'khel'
      ],
    
      'Celebrity Discussion': [
        'celebrity', 'actor', 'actress', 'singer', 'star', 'bollywood', 'hollywood',
        'film', 'movie',
        'सेलिब्रिटी', 'अभिनेता', 'अभिनेत्री', 'गायक', 'स्टार', 'बॉलीवुड', 'हॉलीवुड', 'फिल्म',
        'famous', 'popular', 'superstar', 'hero', 'heroine', 'artist', 'performer',
        'प्रसिद्ध', 'मशहूर', 'सुपरस्टार', 'हीरो', 'हीरोइन', 'कलाकार',
        'khan', 'kumar', 'singh', 'sharma', 'kapoor', 'bhatt', 'chopra', 'kaif',
        'खान', 'कुमार', 'सिंह', 'शर्मा', 'कपूर', 'भट्ट', 'चोपड़ा', 'कैफ',
        'acting', 'singing', 'dancing', 'performance', 'concert', 'album', 'song',
        'अभिनय', 'गायन', 'नृत्य', 'प्रदर्शन', 'कॉन्सर्ट', 'एल्बम', 'गाना'
      ],
    
      'Entertainment': [
        'music', 'song', 'tv', 'show', 'series',
        'गाना', 'संगीत', 'टीवी', 'शो'
      ],
    
      'Travel & Places': [
        'travel', 'trip', 'place', 'city', 'country', 'flight', 'train', 'ticket', 'hotel',
        'यात्रा', 'सफर', 'जगह', 'पासपोर्ट', 'होटल', 'विसा', 'yatra', 'safar'
      ],
    
      'Education & Learning': [
        'study', 'school', 'college', 'education', 'learn',
        'पढ़ाई', 'स्कूल', 'कॉलेज', 'padhai'
      ],
    
      'Work & Career': [
        'job', 'work', 'office', 'career', 'business',
        'काम', 'नौकरी', 'ऑफिस', 'kaam', 'naukri'
      ],
    
      'Family & Relationships': [
        'family', 'friend', 'relationship', 'marriage',
        'परिवार', 'दोस्त', 'शादी', 'parivar'
      ],
    
      'Shopping & Money': [
        'shopping', 'buy', 'sell', 'money', 'price',
        'amazon', 'flipkart', 'myntra', 'nike', 'adidas', 'brand',
        'खरीदारी', 'पैसा', 'कीमत', 'kharidari', 'ब्रांड', 'ऑनलाइन शॉपिंग'
      ],
    
      'News & Current Events': [
        'news', 'politics', 'government', 'election',
        'समाचार', 'राजनीति', 'सरकार', 'samachar'
      ],
    
      'Hobbies & Interests': [
        'hobby', 'interest', 'reading', 'painting',
        'शौक', 'रुचि', 'पढ़ना', 'shauk'
      ],
    
      'General Chat': [
        'hello', 'hi', 'how are you', 'good morning', 'good evening', 'how are you doing',
        'what\'s up', 'hey', 'greetings', 'nice to meet you', 'pleased to meet you',
        'नमस्ते', 'हैलो', 'कैसे हैं', 'क्या हाल है', 'कैसे हो', 'आप कैसे हैं'
      ],
    
      // 🆕 Extra categories
    
      'Religion & Spirituality': [
        'god', 'bhagwan', 'allah', 'temple', 'church', 'mandir', 'masjid',
        'धर्म', 'भगवान', 'मंदिर', 'मस्जिद', 'धार्मिक', 'spiritual', 'prayer'
      ],
    
      'Politics & Leaders': [
        'prime minister', 'president', 'minister', 'bjp', 'congress', 'vote',
        'मोदी', 'योगी', 'राजनीतिक', 'election', 'government policy'
      ],
    
      'Finance & Crypto': [
        'bitcoin', 'crypto', 'stock', 'trading', 'investment', 'shares',
        'मुद्रा', 'शेयर', 'निवेश', 'पैसा कमाना', 'finance', 'bank loan'
      ],
    
      'Movies & OTT': [
        'netflix', 'amazon prime', 'zee5', 'hotstar', 'movie review', 'trailer',
        'फिल्म देखना', 'सीरीज', 'वेब सीरीज', 'ओटीटी'
      ],
    
      'Gaming': [
        'pubg', 'free fire', 'minecraft', 'valorant', 'bgmi', 'gameplay',
        'खेलना', 'गेमिंग', 'video game'
      ],
    
      'Fashion & Lifestyle': [
        'clothes', 'fashion', 'style', 'makeup', 'shoes', 'trend',
        'कपड़े', 'फैशन', 'स्टाइल', 'सौंदर्य प्रसाधन', 'जूते'
      ],
    
      'Astrology & Superstition': [
        'zodiac', 'rashifal', 'kundli', 'horoscope', 'astrology', 'vastu',
        'ज्योतिष', 'राशि', 'कुंडली', 'भाग्य'
      ],
    
      'Random Fun / Jokes': [
        'joke', 'funny', 'meme', 'हंसी', 'चुटकुला', 'मजेदार'
      ],
    
      // 🆕 From my extended list
      'Love & Dating': [
        'love', 'girlfriend', 'boyfriend', 'date', 'romance', 'crush', 'kiss',
        'प्यार', 'प्रेम', 'गर्लफ्रेंड', 'बॉयफ्रेंड', 'रोमांस', 'डेट'
      ],
    
      'Festivals & Culture': [
        'diwali', 'holi', 'eid', 'christmas', 'festival', 'celebration',
        'त्योहार', 'होली', 'दीवाली', 'ईद', 'क्रिसमस', 'उत्सव'
      ],
    
      'Animals & Pets': [
        'dog', 'cat', 'pet', 'animal', 'puppy', 'kitten', 'bird',
        'कुत्ता', 'बिल्ली', 'पशु', 'पालतू'
      ],
    
      'Vehicles & Automobiles': [
        'car', 'bike', 'motorcycle', 'bus', 'truck', 'engine', 'mileage',
        'कार', 'बाइक', 'वाहन', 'गाड़ी', 'मोटर'
      ],
    
      'Science & Space': [
        'space', 'nasa', 'moon', 'mars', 'rocket', 'planet', 'alien',
        'अंतरिक्ष', 'चाँद', 'मंगल', 'ग्रह', 'रॉकेट'
      ],
    
      'History & Kings': [
        'history', 'freedom', 'independence', 'ancient', 'king', 'queen',
        'इतिहास', 'स्वतंत्रता', 'राजा', 'रानी', 'पुराना जमाना'
      ],
    
      'Home & Daily Life': [
        'house', 'cleaning', 'laundry', 'kitchen', 'furniture', 'rent',
        'घर', 'सफाई', 'कपड़े धोना', 'फर्नीचर', 'किराया'
      ],
    
      'Math & Puzzles': [
        'math', 'algebra', 'geometry', 'puzzle', 'riddle',
        'गणित', 'पहेली', 'समस्या', 'गणना'
      ],
    
      'Programming & Coding': [
        'java', 'python', 'react', 'code', 'bug', 'software error',
        'कोडिंग', 'प्रोग्रामिंग', 'सॉफ्टवेयर'
      ]
    };
    

    // Check for off-topic conversations - return same title for all non-medical topics
    for (const [intent, keywords] of Object.entries(offTopicPatterns)) {
      const matchedKeyword = keywords.find(keyword => cleanText.includes(keyword));
      if (matchedKeyword) {
        console.log('✅ Found off-topic match:', intent, 'for keyword:', matchedKeyword);
        return 'General Conversations'; // Same title for all non-medical conversations
      }
    }
    console.log('❌ No off-topic matches found');

    // Check for general conversation topics - all return same title
    if (cleanText.includes('help') || cleanText.includes('मदद') || cleanText.includes('madad')) {
      return 'General Conversations';
    }
    
    if (cleanText.includes('question') || cleanText.includes('सवाल') || cleanText.includes('sawal')) {
      return 'General Conversations';
    }

    // Check if it contains any personal pronouns or casual conversation
    const casualConversation = ['i am', 'i was', 'i will', 'my name', 'tell me about', 'what is', 'how to', 
                               'मैं हूं', 'मेरा नाम', 'बताइए', 'क्या है', 'कैसे करें', 'main hun'];
    
    if (casualConversation.some(phrase => cleanText.includes(phrase))) {
      return 'General Conversations';
    }
    
    // Final fallback - for unclear conversations that don't match any category
    console.log('🔄 Using final fallback: General Conversations');
    return 'General Conversations';
  };

  // Handle end call
  const handleEndCall = async () => {
    console.log('Ending call - stopping all audio and recognition');
    isShuttingDownRef.current = true;

    // Stop any scheduled restarts/timeouts immediately
    clearAllTimeouts();

    // Save voice conversation to chat history before ending session
    if (currentSessionId) {
      await saveVoiceConversationToHistory(currentSessionId);
    }

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
    // Stop Azure audio immediately
    if (azureAudioRef.current) {
      try { azureAudioRef.current.pause(); } catch {}
      azureAudioRef.current = null;
    }
    if (azureAudioUrlRef.current) {
      try { URL.revokeObjectURL(azureAudioUrlRef.current); } catch {}
      azureAudioUrlRef.current = null;
    }

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