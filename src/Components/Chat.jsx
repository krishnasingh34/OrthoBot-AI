import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Mic, 
  Plus,
  Search,
  Menu,
  X,
  User,
  MoreVertical,
  Edit2,
  Pin,
  Trash2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Square,
  Volume2,
  VolumeX,
  Share,
  LogOut
} from 'lucide-react';
import Navbar from './Navbar';
import VoiceCallingInterface from './VoiceCallingInterface';
import ChatHistoryService from '../services/chatHistoryService';
import { useAuth } from '../contexts/AuthContext';
import '../CSS/Chat.css';
import profileLogo from '../assets/favicon.png';

// Function to make URLs clickable in text
const makeLinksClickable = (text) => {
  if (!text) return text;
  
  // First convert newlines to HTML line breaks
  let formattedText = text.replace(/\n/g, '<br>');
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
  
  return formattedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #4a9eff !important; text-decoration: underline; word-break: break-all; font-weight: 500;">${url}</a>`;
  });
};

const Chat = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, authService, logout } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isWelcomeScreen, setIsWelcomeScreen] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null); // MongoDB chat ID
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState({ show: false, sessionId: null, x: 0, y: 0 });
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalQuery, setSearchModalQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [hoveredMessage, setHoveredMessage] = useState(null);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [messageFeedback, setMessageFeedback] = useState({}); // { [messageId]: 'good' | 'bad' }
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [showVoiceCalling, setShowVoiceCalling] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const startedByVoiceRef = useRef(false);
  const currentUtteranceRef = useRef(null);
  const voicesReadyRef = useRef(false);
  const shouldAutoSpeakRef = useRef(false);
  const chatHistoryService = useRef(new ChatHistoryService(authService));

  // Add resize listener to handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // If transitioning from mobile to desktop view, ensure sidebar can be open
      if (!isMobileView()) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ensure voices are loaded; returns voices list (may be empty on some envs)
  const getVoicesAsync = () => {
    return new Promise((resolve) => {
      try {
        const synth = window.speechSynthesis;
        if (!synth) return resolve([]);
        let voices = synth.getVoices();
        if (voices && voices.length > 0) {
          voicesReadyRef.current = true;
          return resolve(voices);
        }
        const handler = () => {
          voices = synth.getVoices();
          if (voices && voices.length > 0) {
            synth.removeEventListener('voiceschanged', handler);
            voicesReadyRef.current = true;
            resolve(voices);
          }
        };
        synth.addEventListener('voiceschanged', handler);
        // Fallback timeout
        setTimeout(() => {
          synth.removeEventListener('voiceschanged', handler);
          resolve(synth.getVoices());
        }, 1500);
      } catch (_) {
        resolve([]);
      }
    });
  };

  // Try to pick best voice for a language tag (e.g., 'hi-IN', 'en-US')
  const pickBestVoice = async (langTag) => {
    const voices = await getVoicesAsync();
    if (!voices || voices.length === 0) return null;
    const norm = (s) => (s || '').toLowerCase();
    const lang = norm(langTag);
    // 1) exact startsWith match
    let best = voices.find(v => norm(v.lang).startsWith(lang));
    if (best) return best;
    // 2) any contains 'hi' or 'en' depending on request
    const needle = lang.includes('hi') ? 'hi' : (lang.includes('en') ? 'en' : lang.slice(0,2));
    best = voices.find(v => norm(v.lang).includes(needle));
    if (best) return best;
    // 3) name hints
    if (needle === 'hi') {
      best = voices.find(v => /hindi|india|hi-?in/i.test(v.name));
      if (best) return best;
    }
    return null;
  };

  // Placeholder text for different languages
  const placeholders = {
    en: "Ask me about your recovery, exercise or any orthopedic questions...",
    hi: "अपनी रिकवरी, व्यायाम या किसी भी हड्डी रोग संबंधी प्रश्न के बारे में पूछें..."
  };

  // Handle language change
  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  // Load chat sessions from MongoDB on component mount and when authentication changes
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        if (isAuthenticated) {
          // Load chat history from MongoDB for authenticated user
          const result = await chatHistoryService.current.getUserChatHistory(20, 0);
          if (result.success && result.chats) {
            // Convert MongoDB format to local format for compatibility
            const convertedSessions = result.chats.map(chat => ({
              id: chat.chatId,
              title: chat.title,
              messages: [], // Messages will be loaded when chat is selected
              lastUpdated: chat.updatedAt,
              createdAt: chat.createdAt,
              isVoiceCall: chat.isVoiceSession,
              totalMessages: chat.totalMessages
            }));
            setChatSessions(convertedSessions);
          }

          // Check for saved current session
          const savedCurrentChatId = localStorage.getItem('orthobotCurrentChatId');
          if (savedCurrentChatId) {
            await loadChatConversation(savedCurrentChatId);
          } else {
            setIsWelcomeScreen(true);
            setMessages([]);
          }
        } else {
          // For non-authenticated users, use localStorage fallback
          const savedSessions = localStorage.getItem('orthobotChatSessions');
          if (savedSessions) {
            const sessions = JSON.parse(savedSessions);
            setChatSessions(sessions);
          } else {
            setChatSessions([]);
          }
          
          // Also migrate any existing localStorage sessions (for backward compatibility)
          const localSessions = chatHistoryService.current.migrateLocalStorageChats();
          if (localSessions.length > 0) {
            console.log('Found local sessions for potential migration:', localSessions.length);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Fallback to localStorage if MongoDB fails
        const savedSessions = localStorage.getItem('orthobotChatSessions');
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          setChatSessions(sessions);
        }
      }
    };

    loadChatHistory();
    document.body.classList.add('chat-page');
    return () => {
      document.body.classList.remove('chat-page');
    };
  }, [isAuthenticated]); // Re-run when authentication status changes

  // Clear chat history when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear current chat state
      setMessages([]);
      setCurrentChatId(null);
      setCurrentSessionId(null);
      setIsWelcomeScreen(true);
      
      // Clear saved current chat ID
      localStorage.removeItem('orthobotCurrentChatId');
      
      // Reset chat sessions to empty or localStorage fallback
      const savedSessions = localStorage.getItem('orthobotChatSessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        setChatSessions(sessions);
      } else {
        setChatSessions([]);
      }
    }
  }, [isAuthenticated]);

  // Function to load a specific chat conversation
  const loadChatConversation = async (chatId) => {
    try {
      const result = await chatHistoryService.current.getChatConversation(chatId);
      if (result.success && result.chat) {
        // Convert MongoDB messages to local format
        const convertedMessages = result.chat.messages.map(msg => ({
          id: msg.messageId || Date.now() + Math.random(),
          type: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        
        setMessages(convertedMessages);
        setCurrentChatId(chatId);
        setCurrentSessionId(chatId); // For compatibility
        setIsWelcomeScreen(convertedMessages.length === 0);
        
        // Save current chat ID
        localStorage.setItem('orthobotCurrentChatId', chatId);
      }
    } catch (error) {
      console.error('Error loading chat conversation:', error);
    }
  };

  // Handle pending question after component is fully loaded
  useEffect(() => {
    const pendingQuestion = sessionStorage.getItem('pendingQuestion');
    const source = sessionStorage.getItem('pendingQuestionSource') || 'text';
    if (pendingQuestion) {
      // Set the input value and auto-send
      setInputValue(pendingQuestion);
      setTimeout(() => {
        processIncomingQuestion(pendingQuestion, source);
      }, 500);
      // Clear pending question
      sessionStorage.removeItem('pendingQuestion');
      sessionStorage.removeItem('pendingQuestionSource');
    }
  }, [chatSessions]);

  // Save current chat ID to localStorage
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('orthobotCurrentChatId', currentChatId);
    } else {
      localStorage.removeItem('orthobotCurrentChatId');
    }
  }, [currentChatId]);

  // Update chat sessions list when messages change (for UI updates)
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      setChatSessions(prev => prev.map(session => 
        session.id === currentChatId 
          ? { ...session, totalMessages: messages.length, lastUpdated: new Date().toISOString() }
          : session
      ));
    }
  }, [messages, currentChatId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Keep textarea height fixed
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  }, [inputValue]);

  // Speak bot responses via TTS
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    // Only auto-speak if flagged (fresh response), not when loading chat history
    if (!shouldAutoSpeakRef.current) return;
    if (last.type !== 'bot' || last.isLoading) return;
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(
          // If bot message contains HTML, read its textContent
          (() => {
            const temp = document.createElement('div');
            temp.innerHTML = String(last.text || '');
            return temp.textContent || temp.innerText || '';
          })()
        );
        const lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
        utter.lang = lang;
        // pick a voice asynchronously; if not found, let browser choose default
        pickBestVoice(lang).then((match) => {
          if (match) utter.voice = match;
        }).finally(() => {
          currentUtteranceRef.current = utter;
          utter.onstart = () => { setIsSpeaking(true); setSpeakingMessageId(last.id); shouldAutoSpeakRef.current = false; };
          utter.onend = () => { setIsSpeaking(false); setSpeakingMessageId(null); shouldAutoSpeakRef.current = false; };
          utter.onerror = () => { setIsSpeaking(false); setSpeakingMessageId(null); shouldAutoSpeakRef.current = false; };
          window.speechSynthesis.speak(utter);
        });
      }
    } catch (e) {
      console.warn('TTS failed:', e);
    }
  }, [messages, selectedLanguage]);

  // Initialize and toggle Speech Recognition
  const toggleVoice = () => {
    // Show voice calling interface instead of direct recognition
    setShowVoiceCalling(true);
  };

  // Handle starting conversation from voice calling interface
  const handleStartConversation = (userMessage, detectedLanguage) => {
    // Update the detected language if it's different from current selection
    if (detectedLanguage === 'hindi' || detectedLanguage === 'hinglish') {
      if (selectedLanguage !== 'hi') {
        setSelectedLanguage('hi');
      }
    } else {
      if (selectedLanguage !== 'en') {
        setSelectedLanguage('en');
      }
    }
    
    // Start the conversation with the user's message
    handleSendMessage(userMessage, 'voice');
  };

  // Utility: extract plain text from potentially HTML bot message
  const getPlainFromHtml = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = String(html || '');
    return temp.textContent || temp.innerText || '';
  };

  // Detect if text contains Hindi/Devanagari script
  const containsHindi = (text) => {
    const hindiRegex = /[\u0900-\u097F]/;
    return hindiRegex.test(text);
  };

  // Start speaking a message (auto-detect language or force specific lang)
  const startSpeaking = async (message, forceLang = null) => {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const text = message.type === 'bot' ? getPlainFromHtml(message.text) : String(message.text || '');
      const utter = new SpeechSynthesisUtterance(text);
      // Auto-detect language: Hindi if Devanagari script present, otherwise English
      const lang = forceLang || (containsHindi(text) ? 'hi-IN' : 'en-US');
      utter.lang = lang;
      const match = await pickBestVoice(lang);
      if (match) utter.voice = match;
      currentUtteranceRef.current = utter;
      utter.onstart = () => { setIsSpeaking(true); setSpeakingMessageId(message.id); };
      utter.onend = () => { setIsSpeaking(false); setSpeakingMessageId(null); };
      utter.onerror = () => { setIsSpeaking(false); setSpeakingMessageId(null); };
      window.speechSynthesis.speak(utter);
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } finally {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  // Handle saving voice conversation to chat history (ChatGPT style)
  const handleSaveVoiceHistory = async (voiceMessages, chatTitle) => {
    if (!voiceMessages || voiceMessages.length === 0) return;
    
    console.log('Saving voice conversation to chat history:', chatTitle, voiceMessages);
    
    try {
      // Convert voice messages to MongoDB format
      const conversationHistory = voiceMessages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text,
        timestamp: new Date()
      }));

      // Save to MongoDB
      const result = await chatHistoryService.current.saveVoiceConversation(
        conversationHistory,
        { detectedLanguage: selectedLanguage, chatTitle }
      );

      if (result.success) {
        // Add to local chat sessions list for immediate UI update
        const newSession = {
          id: result.chatId,
          title: result.title,
          messages: voiceMessages,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isVoiceCall: true,
          totalMessages: voiceMessages.length
        };
        
        setChatSessions(prev => [newSession, ...prev]);
        console.log('Voice conversation saved to MongoDB successfully');
      }
    } catch (error) {
      console.error('Error saving voice conversation to MongoDB:', error);
      
      // Fallback to localStorage
      const newSessionId = Date.now().toString();
      const newSession = {
        id: newSessionId,
        title: chatTitle,
        messages: voiceMessages,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isVoiceCall: true
      };
      
      setChatSessions(prev => [newSession, ...prev]);
      const updatedSessions = [newSession, ...chatSessions];
      localStorage.setItem('orthobotChatSessions', JSON.stringify(updatedSessions));
    }
  };


  // Extract intent from user query (ChatGPT style)
  const extractIntent = (text) => {
    const cleanText = text.toLowerCase().trim();
    
    // Define intent patterns like ChatGPT
    const intentPatterns = {
      'Post-operative care': ['post-operative', 'post operative', 'after surgery', 'post surgery'],
      'Knee recovery': ['knee', 'knee pain', 'knee surgery', 'knee injury'],
      'Back pain relief': ['back pain', 'back injury', 'back surgery', 'spine'],
      'Shoulder rehabilitation': ['shoulder', 'shoulder pain', 'shoulder surgery', 'shoulder injury'],
      'Hip replacement care': ['hip', 'hip replacement', 'hip surgery', 'hip pain'],
      'Exercise guidance': ['exercise', 'workout', 'physical therapy', 'stretching'],
      'Recovery timeline': ['recovery time', 'how long', 'timeline', 'healing time'],
      'Pain management': ['pain relief', 'manage pain', 'reduce pain', 'pain medication'],
      'Mobility improvement': ['mobility', 'movement', 'range of motion', 'flexibility'],
      'Wound care': ['wound', 'incision', 'stitches', 'healing'],
      'Return to activities': ['return to work', 'return to sport', 'normal activities'],
      'Rehabilitation plan': ['rehabilitation', 'rehab', 'therapy plan'],
      'General orthopedic': ['orthopedic', 'bone', 'joint', 'muscle']
    };
    
    // Find matching intent
    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      if (keywords.some(keyword => cleanText.includes(keyword))) {
        return intent;
      }
    }
    
    // Fallback: extract key medical terms
    const medicalTerms = ['surgery', 'recovery', 'pain', 'therapy', 'exercise', 'treatment', 'injury', 'healing'];
    const foundTerm = medicalTerms.find(term => cleanText.includes(term));
    
    if (foundTerm) {
      return foundTerm.charAt(0).toUpperCase() + foundTerm.slice(1) + ' question';
    }
    
    return 'General consultation';
  };

  // Filter chat sessions based on search query
  const filteredChatSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async (questionText = null, source = 'text') => {
    const messageText = questionText || inputValue.trim();
    if (messageText) {
      setIsWelcomeScreen(false);
      const newMessage = {
        id: Date.now(),
        type: 'user',
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      
      // Get or create active chat using MongoDB
      let activeChatId = currentChatId;
      if (!activeChatId) {
        try {
          const chatTitle = chatHistoryService.current.extractIntent(messageText);
          const result = await chatHistoryService.current.createNewChat(chatTitle, 'text_chat');
          if (result.success) {
            activeChatId = result.chatId;
            setCurrentChatId(activeChatId);
            setCurrentSessionId(activeChatId);
            
            // Add to local sessions list
            const newSession = {
              id: activeChatId,
              title: result.title,
              messages: updatedMessages,
              lastUpdated: new Date().toISOString(),
              createdAt: result.createdAt,
              isVoiceCall: false,
              totalMessages: 1
            };
            setChatSessions(prev => [newSession, ...prev]);
          }
        } catch (error) {
          console.error('Error creating new chat:', error);
        }
      }
      
      setInputValue('');
      
      // Get AI response using MongoDB Backend API
      getMongoDBResponse(messageText, activeChatId, source);
    }
  };

  // Process incoming question from ChatDemo
  const processIncomingQuestion = async (questionText, source = 'text') => {
    setIsWelcomeScreen(false);
    const newMessage = {
      id: Date.now(),
      type: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedMessages = [newMessage];
    setMessages(updatedMessages);
    
    // Create new chat session using MongoDB
    try {
      const chatTitle = chatHistoryService.current.extractIntent(questionText);
      const result = await chatHistoryService.current.createNewChat(chatTitle, 'text_chat');
      if (result.success) {
        setCurrentChatId(result.chatId);
        setCurrentSessionId(result.chatId);
        
        // Add to local sessions list
        const newSession = {
          id: result.chatId,
          title: result.title,
          messages: updatedMessages,
          lastUpdated: new Date().toISOString(),
          createdAt: result.createdAt,
          isVoiceCall: false,
          totalMessages: 1
        };
        setChatSessions(prev => [newSession, ...prev]);
        
        setInputValue('');
        
        // Get AI response using MongoDB Backend API
        getMongoDBResponse(questionText, result.chatId, source);
      }
    } catch (error) {
      console.error('Error creating new chat for incoming question:', error);
      // Fallback to old method
      getBackendResponse(questionText, updatedMessages, source);
    }
  };

  // MongoDB Backend API integration for real-time responses
  const getMongoDBResponse = async (userMessage, chatId, source = 'text') => {
    setIsGenerating(true);
    shouldAutoSpeakRef.current = source === 'voice';
    
    // Add loading message
    const loadingMessage = {
      id: Date.now() + 1,
      type: 'bot',
      text: 'Thinking...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: true
    };
    
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Use the chat history service to send message and get response
      const result = await chatHistoryService.current.sendMessage(userMessage, chatId, source);
      
      if (result.response || result.answer) {
        const botResponse = result.response || result.answer;
        const botMessage = {
          id: Date.now() + 2,
          type: 'bot',
          text: botResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLoading: false
        };

        // Replace loading message with actual response
        setMessages(prev => prev.map(msg => 
          msg.isLoading ? botMessage : msg
        ));

        // Update current chat ID if returned
        if (result.chatId && result.chatId !== chatId) {
          setCurrentChatId(result.chatId);
          setCurrentSessionId(result.chatId);
        }
      } else {
        throw new Error('No response received from server');
      }
    } catch (error) {
      console.error('Error getting MongoDB response:', error);
      
      // Fallback to original backend response
      const currentMessages = messages.filter(msg => !msg.isLoading);
      getBackendResponse(userMessage, currentMessages, source);
    } finally {
      setIsGenerating(false);
    }
  };

  // Backend API integration for real-time responses
  const getBackendResponse = async (userMessage, currentMessages, source = 'text') => {
    setIsGenerating(true);
    // Mark that the next bot message should be auto spoken only if initiated by voice
    shouldAutoSpeakRef.current = source === 'voice';
    // Add loading message
    const loadingMessage = {
      id: Date.now() + 1,
      type: 'bot',
      text: 'Thinking...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: true
    };
    
    const messagesWithLoading = [...currentMessages, loadingMessage];
    setMessages(messagesWithLoading);

    try {
      // prepare abort controller for cancellation
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      // Try multiple backend URL formats
      const backendUrls = [
        `${import.meta.env.VITE_BACKEND_URL}/askAI`,
        `${import.meta.env.VITE_BACKEND_URL}/api/askAI`,
        `${import.meta.env.VITE_BACKEND_URL}/chat`
      ];

      let response = null;
      let lastError = null;

      for (const url of backendUrls) {
        try {
          console.log('Trying backend URL:', url);
          
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // 'Accept': 'application/json',
              // 'Access-Control-Allow-Origin': '*'
            },
            mode: 'cors',
            signal,
            body: JSON.stringify({
              question: userMessage,
              message: userMessage,
              prompt: userMessage,
              query: userMessage
            })
          });

          if (response.ok) {
            console.log('Successfully connected to:', url);
            break;
          } else {
            console.log(`URL ${url} failed with status:`, response.status);
            lastError = `Status ${response.status}`;
          }
        } catch (fetchError) {
          if (signal.aborted) {
            throw new Error('aborted');
          }
          console.log(`URL ${url} failed with error:`, fetchError.message);
          lastError = fetchError.message;
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error(`All backend URLs failed. Last error: ${lastError}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Backend returned non-JSON response:', errorText);
        throw new Error('Backend returned HTML instead of JSON - server may be down or misconfigured');
      }

      const data = await response.json();
      console.log('Backend API Response:', data);
      
      // Remove loading message and add actual response
      const botResponse = {
        id: Date.now() + 2,
        type: 'bot',
        text: data.response || data.answer || data.message || data.reply || 'Sorry, I could not process your request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...currentMessages, botResponse];
      setMessages(finalMessages);
      
      // Update session with bot response
      setChatSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: finalMessages, lastUpdated: new Date().toISOString() }
          : session
      ));

    } catch (error) {
      if (error.message === 'aborted') {
        // user stopped generation: remove loading and do nothing
        setMessages(prev => prev.filter(m => !m.isLoading));
      } else {
        console.error('Error getting backend response:', error);
        // Remove loading message and add error response
        const botResponse = {
          id: Date.now() + 2,
          type: 'bot',
          text: `Connection failed: ${error.message}. Please check if your backend server is running and accessible. You can try refreshing the page or contact support.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const finalMessages = [...currentMessages, botResponse];
        setMessages(finalMessages);
        // Update session with error response
        setChatSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, messages: finalMessages, lastUpdated: new Date().toISOString() }
            : session
        ));
      }
    }
    finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: Allow new line (don't prevent default)
        return;
      } else {
        // Enter: Send message
        e.preventDefault();
        e.stopPropagation();
        handleSendMessage();
      }
    }
  };

  const isMobileView = () => {
    return window.innerWidth < 768; // Match the CSS breakpoint
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const startNewChat = () => {
    setMessages([]);
    setIsWelcomeScreen(true);
    setInputValue('');
    setCurrentSessionId(null);
    setCurrentChatId(null);
    
    // Only close sidebar on mobile view
    if (isMobileView()) {
      setSidebarOpen(false);
    }
    
    // Clear saved current chat ID
    localStorage.removeItem('orthobotCurrentChatId');
  };

  const loadChatSession = async (sessionId) => {
    try {
      // Load chat conversation from MongoDB
      await loadChatConversation(sessionId);
      
      // Prevent auto-speaking when loading existing conversations
      shouldAutoSpeakRef.current = false;
      
      // Only close sidebar on mobile view
      if (isMobileView()) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      
      // Fallback to local session if available
      const session = chatSessions.find(s => s.id === sessionId);
      if (session && session.messages) {
        setMessages(session.messages);
        setCurrentSessionId(sessionId);
        setCurrentChatId(sessionId);
        setIsWelcomeScreen(session.messages.length === 0);
        shouldAutoSpeakRef.current = false;
      }
    }
  };

  const handleContextMenu = (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      sessionId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, sessionId: null, x: 0, y: 0 });
  };

  const handleRename = (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setEditingSession(sessionId);
      setEditTitle(session.title);
    }
    closeContextMenu();
  };

  const saveRename = async () => {
    if (editTitle.trim()) {
      try {
        // Update title in MongoDB
        const result = await chatHistoryService.current.updateChatTitle(editingSession, editTitle.trim());
        if (result.success) {
          // Update local state
          setChatSessions(prev => prev.map(session => 
            session.id === editingSession 
              ? { ...session, title: editTitle.trim() }
              : session
          ));
        }
      } catch (error) {
        console.error('Error updating chat title:', error);
        // Still update locally as fallback
        setChatSessions(prev => prev.map(session => 
          session.id === editingSession 
            ? { ...session, title: editTitle.trim() }
            : session
        ));
      }
    }
    setEditingSession(null);
    setEditTitle('');
  };

  const cancelRename = () => {
    setEditingSession(null);
    setEditTitle('');
  };

  const handlePin = (sessionId) => {
    setChatSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, pinned: !session.pinned }
        : session
    ));
    closeContextMenu(); 
  };  

  const handleDelete = async (sessionId) => {
    try {
      // Delete from MongoDB
      const result = await chatHistoryService.current.deleteChat(sessionId);
      if (result.success) {
        // Update local state
        setChatSessions(prev => prev.filter(session => session.id !== sessionId));
        if (currentSessionId === sessionId || currentChatId === sessionId) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Still delete locally as fallback
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      if (currentSessionId === sessionId || currentChatId === sessionId) {
        startNewChat();
      }
    }
    closeContextMenu();
  };

  const handleShare = async (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      try {
        // First, load the actual messages from MongoDB
        const chatResult = await chatHistoryService.current.getChatConversation(sessionId);
        if (!chatResult.success || !chatResult.chat) {
          throw new Error('Failed to load chat messages');
        }

        // Convert MongoDB messages to the format expected by the share API
        const messagesToShare = chatResult.chat.messages.map(msg => ({
          id: msg.messageId || Date.now() + Math.random(),
          type: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        
        const response = await fetch(`${backendUrl}/api/share/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shareType: 'full_chat',
            title: session.title,
            messages: messagesToShare
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create share link');
        }

        const result = await response.json();
        const shareUrl = `${window.location.origin}/share/${result.shareId}`;
        
        // Try to use Web Share API if available
        if (navigator.share) {
          await navigator.share({
            title: `OrthoBot AI Chat: ${session.title}`,
            text: `Check out this conversation from OrthoBot AI`,
            url: shareUrl
          });
        } else {
          // Fallback: Copy to clipboard
          await navigator.clipboard.writeText(shareUrl);
          alert('Share link copied to clipboard! Anyone with this link can view the conversation.');
        }
      } catch (error) {
        console.error('Share failed:', error);
        alert('Unable to create share link. Please try again.');
      }
    }
    closeContextMenu();
  };

  // Share individual bot message
  const handleShareMessage = async (message) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      
      const response = await fetch(`${backendUrl}/api/share/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareType: 'single_message',
          title: `OrthoBot AI Response - ${message.timestamp}`,
          singleMessage: message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const result = await response.json();
      const shareUrl = `${window.location.origin}/share/${result.shareId}`;
      
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: 'OrthoBot AI Response',
          text: 'Check out this helpful response from OrthoBot AI',
          url: shareUrl
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard! Anyone with this link can view this response.');
      }
    } catch (error) {
      console.error('Share message failed:', error);
      alert('Unable to create share link. Please try again.');
    }
  };
  
// Copy message functionality with formatting preservation for bot HTML
  const convertHtmlToPlainText = (html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    let output = '';
  
    const walk = (node, inList = false) => {
      if (node.nodeType === Node.TEXT_NODE) {
        output += node.textContent.trim();
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
  
      const tag = node.tagName.toLowerCase();
  
      if (tag === 'br') {
        output += '\n';
        return;
      }
  
      if (tag === 'li') {
        node.childNodes.forEach((child) => walk(child, true));
        output += '\n';
        return;
      }
  
      const blockTags = [
        'p', 'div', 'section', 'article', 'header', 'footer',
        'h1','h2','h3','h4','h5','h6'
      ];
      const isBlock = blockTags.includes(tag);
      const isList = tag === 'ul' || tag === 'ol';
  
      // ensure spacing before block
      if (isBlock && !output.endsWith('\n\n') && output !== '') {
        output += '\n\n';
      }
  
      node.childNodes.forEach((child) => walk(child, inList || isList));
  
      // ensure spacing after block
      if (isBlock && !output.endsWith('\n\n')) {
        output += '\n\n';
      }
    };
  
    container.childNodes.forEach((child) => walk(child));
  
    return output
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n') // clean spaces before line breaks
      .replace(/\n{3,}/g, '\n\n') // collapse >2 newlines into exactly 2
      .trim();
  };
  

  const handleCopyMessage = async (message) => {
    try {
      const text = message.text;
      const isBotHtml = message.type === 'bot';
      const plain = isBotHtml ? convertHtmlToPlainText(text) : String(text);

      if (isBotHtml && window.ClipboardItem && navigator.clipboard?.write) {
        const blobHtml = new Blob([text], { type: 'text/html' });
        const blobText = new Blob([plain], { type: 'text/plain' });
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
      // Fallback for older browsers
      const fallbackText = (message?.type === 'bot')
        ? convertHtmlToPlainText(message.text)
        : String(message.text);
      const textArea = document.createElement('textarea');
      textArea.value = fallbackText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  // Handle feedback on bot messages
  const handleBotFeedback = (messageId, type) => {
    setMessageFeedback(prev => ({ ...prev, [messageId]: type }));
  };


  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setSearchModalQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openSearchModal = () => {
    setShowSearchModal(true);
    setSearchModalQuery('');
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchModalQuery('');
  };

  const handleSearchModalSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchModalQuery);
    closeSearchModal();
  };

  // Filter sessions for search modal
  const searchModalResults = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchModalQuery.toLowerCase()) ||
    session.messages.some(msg => 
      msg.text.toLowerCase().includes(searchModalQuery.toLowerCase())
    )
  );

  return (
    <div className="chat-page">
      {/* Voice Calling Interface */}
      <VoiceCallingInterface
        isOpen={showVoiceCalling}
        onClose={() => setShowVoiceCalling(false)}
        selectedLanguage={selectedLanguage}
        onSaveVoiceHistory={handleSaveVoiceHistory}
      />
      
      <Navbar />
      
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-controls">
            <button className="hamburger-btn-sidebar" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <button className="close-btn-sidebar" onClick={toggleSidebar}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-actions">
            <button className="sidebar-action-btn new-chat-btn" onClick={startNewChat}>
              <Plus size={16} />
              New chat
            </button>
            <button className="sidebar-action-btn search-btn" onClick={openSearchModal}>
              <Search size={16} />
              Search chats
            </button>
          </div>

          {/* Only show chat history for authenticated users */}
          {isAuthenticated && (
            <>
              <div className="section-divider"></div>
              <div className="chat-history-section">
                <h3 className="section-title">Chat History</h3>
                <div className="chat-history-scrollable">
                  <div className="chat-history-list">
                    {filteredChatSessions.length > 0 ? (
                      filteredChatSessions.map((session) => (
                        <div 
                          key={session.id} 
                          className={`chat-history-item ${currentSessionId === session.id ? 'active' : ''} ${session.pinned ? 'pinned' : ''}`}
                          onClick={() => loadChatSession(session.id)}
                          onContextMenu={(e) => handleContextMenu(e, session.id)}
                        >
                          {editingSession === session.id ? (
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={saveRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename();
                                if (e.key === 'Escape') cancelRename();
                              }}
                              className="edit-title-input"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="session-title">
                              {session.isVoiceCall && <Mic size={14} className="voice-call-icon" />}
                              {session.title}
                            </span>
                          )}
                          {session.pinned && <Pin size={12} className="pin-icon" />}
                          <button
                            className="context-menu-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContextMenu(e, session.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="no-chats-message">
                        {searchQuery ? 'No chats found' : 'No chat history yet'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          
        </div>

        <div className="sidebar-footer">
          <div 
            className={`user-profile ${!isAuthenticated ? 'clickable' : ''}`}
            onClick={!isAuthenticated ? () => navigate('/auth?redirect=/chat') : undefined}
          >
            <User size={20} />
            <span>
              {isAuthenticated && user 
                ? `${user.firstName} ${user.lastName}` 
                : 'Login'
              }
            </span>
            {isAuthenticated && (
              <button 
                className="sidebar-logout-btn"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
        >
          <button 
            className="context-menu-item"
            onClick={() => handleRename(contextMenu.sessionId)}
          >
            <Edit2 size={16} />
            Rename
          </button>
          <button 
            className="context-menu-item"
            onClick={() => handlePin(contextMenu.sessionId)}
          >
            <Pin size={16} />
            {chatSessions.find(s => s.id === contextMenu.sessionId)?.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button 
            className="context-menu-item"
            onClick={() => handleShare(contextMenu.sessionId)}
          >
            <Share size={16} />
            Share
          </button>
          <button 
            className="context-menu-item delete-item"
            onClick={() => handleDelete(contextMenu.sessionId)}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="search-modal-overlay" onClick={closeSearchModal}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <Search size={20} />
              <form onSubmit={handleSearchModalSubmit} className="search-modal-form">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchModalQuery}
                  onChange={(e) => setSearchModalQuery(e.target.value)}
                  className="search-modal-input"
                  autoFocus
                />
              </form>
              <button className="search-modal-close" onClick={closeSearchModal}>
                ×
              </button>
            </div>
            <div className="search-modal-results">
              {searchModalQuery.length > 0 ? (
                searchModalResults.length > 0 ? (
                  searchModalResults.map((session) => (
                    <div
                      key={session.id}
                      className="search-result-item"
                      onClick={() => {
                        loadChatSession(session.id);
                        closeSearchModal();
                      }}
                    >
                      <div className="search-result-content">
                        <div className="search-result-title">{session.title}</div>
                        <div className="search-result-preview">
                          {session.messages.length > 0 
                            ? session.messages[session.messages.length - 1].text.substring(0, 60)
                            : 'No messages yet'
                          }
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-search-results">
                    No conversations found for "{searchModalQuery}"
                  </div>
                )
              ) : (
                <div className="search-modal-help">
                  <div className="search-help-item">
                    <span className="search-help-key">↑↓</span>
                    <span>Navigate</span>
                  </div>
                  <div className="search-help-item">
                    <span className="search-help-key">↵</span>
                    <span>Select</span>
                  </div>
                  <div className="search-help-item">
                    <span className="search-help-key">Esc</span>
                    <span>Close</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hamburger button when sidebar is closed */}
      {!sidebarOpen && (
        <button className="hamburger-btn-fixed" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
      )}

      {/* Main Chat Area */}
      <div className="chat-main">

        <div className="chat-content">
          {isWelcomeScreen ? (
            <motion.div 
              className="welcome-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="welcome-avatar">
                <img src={profileLogo} alt="OrthoBot AI" className="avatar-img" />
              </div>
              <h1 className="welcome-title">Welcome to OrthoBot AI</h1>
              <p className="welcome-subtitle">
                I'm here to help you with your orthopedic recovery journey.
              </p>
              <p className="welcome-description">
                Ask questions using voice or text
              </p>
            </motion.div>
          ) : (
            <div className="messages-container">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`message ${message.type}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <div className="message-avatar">
                    {message.type === 'user' ? (
                      <User size={20} />
                    ) : (
                      <img src={profileLogo} alt="Bot" className="bot-avatar" />
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      {message.isLoading ? (
                        <p><span className="loading-dots"></span></p>
                      ) : message.type === 'bot' ? (
                        <div dangerouslySetInnerHTML={{ __html: makeLinksClickable(message.text) }} />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: makeLinksClickable(message.text) }} />
                      )}
                    </div>
                    {/* Bot timestamp removed as requested */}
                    
                    {/* Copy Button for User Messages */}
                    {message.type === 'user' && !message.isLoading && hoveredMessage === message.id && (
                      <div className="user-copy-container">
                        <button
                          className="user-copy-btn"
                          onClick={() => handleCopyMessage(message)}
                        >
                          {copiedMessageId === message.id ? (
                            <Check size={14} className="copied-icon" />
                          ) : (
                            <Copy size={14} className="copy-icon" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Bot actions bar */}
                    {message.type === 'bot' && !message.isLoading && (
                      <div className={`bot-actions ${messageFeedback[message.id] ? 'has-feedback' : ''}`}>
                        <button
                          className="bot-action-btn"
                          data-label="Copy"
                          onClick={() => handleCopyMessage(message)}
                        >
                          {copiedMessageId === message.id ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          className={`bot-action-btn ${isSpeaking && speakingMessageId === message.id ? 'active' : ''}`}
                          data-label={isSpeaking && speakingMessageId === message.id ? 'Stop speaking' : 'Read aloud'}
                          onClick={() => {
                            if (isSpeaking && speakingMessageId === message.id) {
                              stopSpeaking();
                            } else {
                              startSpeaking(message);
                            }
                          }}
                        >
                          {isSpeaking && speakingMessageId === message.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <button
                          className={`bot-action-btn ${messageFeedback[message.id] === 'good' ? 'active good' : ''}`}
                          data-label="Good response"
                          onClick={() => handleBotFeedback(message.id, 'good')}
                        >
                          <ThumbsUp size={16} />
                        </button>
                        <button
                          className={`bot-action-btn ${messageFeedback[message.id] === 'bad' ? 'active bad' : ''}`}
                          data-label="Bad response"
                          onClick={() => handleBotFeedback(message.id, 'bad')}
                        >
                          <ThumbsDown size={16} />
                        </button>
                        <button
                          className="bot-action-btn"
                          data-label="Share"
                          onClick={() => handleShareMessage(message)}
                        >
                          <Share size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <div className="input-container">
            <textarea
              ref={textareaRef}
              placeholder={isListening ? 'Listening...' : placeholders[selectedLanguage]}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className={`chat-input ${isListening ? 'listening-placeholder' : ''}`}
              disabled={isListening}
              rows={1}
              style={{
                minHeight: '24px',
                maxHeight: '100px',
                resize: 'none',
                overflowY: 'auto'
              }}
              onInput={(e) => {
                // Auto-resize with max height
                e.target.style.height = 'auto';
                const newHeight = Math.min(e.target.scrollHeight, 100);
                e.target.style.height = Math.max(newHeight, 24) + 'px';
              }}
            />
            <div className="input-actions">
              <select 
                className="language-selector"
                value={selectedLanguage}
                onChange={handleLanguageChange}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
              <button className={`voice-btn ${isListening ? 'listening' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVoice(); }}>
                <Mic size={20} />
              </button>
              {isGenerating ? (
                <button
                  className="stop-btn"
                  data-label="Stop response"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                    }
                    // ensure UI resets and loading removed
                    setIsGenerating(false);
                    setMessages(prev => prev.filter(m => !m.isLoading));
                  }}
                >
                  <Square size={18} />
                </button>
              ) : (
                <button className="send-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSendMessage(); }}>
                  <Send size={20} />
                </button>
              )}
            </div>
          </div>
          <p className="input-disclaimer">
          OrthoBot AI can sometimes make mistakes. Always consult with a doctor for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};
export default Chat;
