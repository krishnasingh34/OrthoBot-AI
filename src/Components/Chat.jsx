import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mic, 
  Plus,
  Search,
  Menu,
  User,
  Settings,
  MessageSquare,
  ChevronDown,
  MoreVertical,
  Edit2,
  Pin,
  Download,
  Trash2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Square,
  Volume2,
  VolumeX,
  Languages
} from 'lucide-react';
import Navbar from './Navbar';
import '../CSS/Chat.css';
import profileLogo from '../assets/favicon.png';

const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isWelcomeScreen, setIsWelcomeScreen] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState({ show: false, sessionId: null, x: 0, y: 0 });
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalQuery, setSearchModalQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(null);
  const [messageFeedback, setMessageFeedback] = useState({}); // { [messageId]: 'good' | 'bad' }
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const startedByVoiceRef = useRef(false);
  const currentUtteranceRef = useRef(null);
  const voicesReadyRef = useRef(false);
  const shouldAutoSpeakRef = useRef(false);

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

  // Load chat sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('orthobotChatSessions');
    if (savedSessions) {
      setChatSessions(JSON.parse(savedSessions));
    }
    
    // Add chat-page class to body to disable scrolling
    document.body.classList.add('chat-page');
    
    // Cleanup: remove class when component unmounts
    return () => {
      document.body.classList.remove('chat-page');
    };
  }, []);

  // Handle pending question after component is fully loaded
  useEffect(() => {
    const pendingQuestion = sessionStorage.getItem('pendingQuestion');
    if (pendingQuestion) {
      // Set the input value and auto-send
      setInputValue(pendingQuestion);
      setTimeout(() => {
        processIncomingQuestion(pendingQuestion);
      }, 500);
      // Clear pending question
      sessionStorage.removeItem('pendingQuestion');
    }
  }, [chatSessions]);

  // Save chat sessions to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem('orthobotChatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  // Auto-save current chat messages when they change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      const updatedSessions = chatSessions.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: messages, lastUpdated: new Date().toISOString() }
          : session
      );
      setChatSessions(updatedSessions);
    }
  }, [messages, currentSessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
      }
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        return;
      }
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      let finalTranscript = '';
      setIsListening(true);
      startedByVoiceRef.current = true;
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        const text = (finalTranscript + interim).trim();
        setInputValue(text);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
        // Auto-send if we started recognition and have text
        if (startedByVoiceRef.current) {
          startedByVoiceRef.current = false;
          const toSend = (inputValue || '').trim();
          if (toSend) {
            handleSendMessage(toSend);
          }
        }
      };
      recognition.start();
    } catch (e) {
      setIsListening(false);
      console.warn('Voice start failed:', e);
    }
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

  const handleSendMessage = (questionText = null) => {
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
      
      // Create or update chat session
      if (!currentSessionId) {
        const newSessionId = Date.now().toString();
        const newSession = {
          id: newSessionId,
          title: extractIntent(inputValue),
          messages: updatedMessages,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        setChatSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSessionId);
      } else {
        // Update existing session
        setChatSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, messages: updatedMessages, lastUpdated: new Date().toISOString() }
            : session
        ));
      }
      
      setInputValue('');
      
      // Get AI response using Backend API
      getBackendResponse(messageText, updatedMessages);
    }
  };

  // Process incoming question from ChatDemo
  const processIncomingQuestion = (questionText) => {
    setIsWelcomeScreen(false);
    const newMessage = {
      id: Date.now(),
      type: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedMessages = [newMessage];
    setMessages(updatedMessages);
    
    // Create new chat session
    const newSessionId = Date.now().toString();
    const newSession = {
      id: newSessionId,
      title: extractIntent(questionText),
      messages: updatedMessages,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    
    setInputValue('');
    
    // Get AI response using Backend API
    getBackendResponse(questionText, updatedMessages);
  };

  // Backend API integration for real-time responses
  const getBackendResponse = async (userMessage, currentMessages) => {
    setIsGenerating(true);
    // Mark that the next bot message should be auto spoken
    shouldAutoSpeakRef.current = true;
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
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const startNewChat = () => {
    // Save current chat before starting new one
    if (currentSessionId && messages.length > 0) {
      const updatedSessions = chatSessions.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: messages, lastUpdated: new Date().toISOString() }
          : session
      );
      setChatSessions(updatedSessions);
      localStorage.setItem('orthobotChatSessions', JSON.stringify(updatedSessions));
    }
    
    setMessages([]);
    setIsWelcomeScreen(true);
    setInputValue('');
    setCurrentSessionId(null);
  };

  const loadChatSession = (sessionId) => {
    // Save current chat before switching
    if (currentSessionId && messages.length > 0) {
      const updatedSessions = chatSessions.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: messages, lastUpdated: new Date().toISOString() }
          : session
      );
      setChatSessions(updatedSessions);
      localStorage.setItem('orthobotChatSessions', JSON.stringify(updatedSessions));
    }
    
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      setIsWelcomeScreen(session.messages.length === 0);
      // Prevent auto-speaking when loading existing conversations
      shouldAutoSpeakRef.current = false;
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

  const saveRename = () => {
    if (editTitle.trim()) {
      setChatSessions(prev => prev.map(session => 
        session.id === editingSession 
          ? { ...session, title: editTitle.trim() }
          : session
      ));
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

  const handleDownload = async (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      // Simple and reliable PDF generation
      const generatePDF = () => {
        // Load jsPDF from CDN
        if (!document.getElementById('jspdf-script')) {
          const script = document.createElement('script');
          script.id = 'jspdf-script';
          script.src = 'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js';
          script.onload = () => createPDFDocument();
          script.onerror = () => {
            console.error('Failed to load jsPDF');
            alert('Failed to generate PDF. Please try again.');
          };
          document.head.appendChild(script);
        } else {
          createPDFDocument();
        }
      };
  
      const createPDFDocument = () => {
        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
  
          // Set up document
          let yPos = 20;
          const pageHeight = 270;
          const margin = 20;
  
          // Helper to add text with wrapping
          const addText = (text, x, y, options = {}) => {
            const { bold = false, fontSize = 10, maxWidth = 170, indent = 0 } = options;
  
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setFontSize(fontSize);
  
            const actualWidth = maxWidth - indent;
            const lines = doc.splitTextToSize(text, actualWidth);
            const height = lines.length * 5;
  
            // Page break check
            if (y + height > pageHeight - 10) {
              doc.addPage();
              y = 20;
            }
  
            doc.text(lines, x + indent, y);
            return y + height;
          };
  
          // Title
          yPos = addText(session.title, margin, yPos, { bold: true, fontSize: 18 }) + 4;
  
          // Metadata
          yPos = addText(`Created: ${new Date(session.createdAt).toLocaleDateString()}`, margin, yPos, { fontSize: 9 }) + 1;
          yPos = addText(`Last Updated: ${new Date(session.lastUpdated).toLocaleDateString()}`, margin, yPos, { fontSize: 9 }) + 3;
  
          // Separator line
          doc.line(margin, yPos, 190, yPos);
          yPos += 10;
  
          // Chat History header
          yPos = addText('Chat History', margin, yPos, { bold: true, fontSize: 14 }) + 4;
  
          // Section headings we want bold
          const sectionHeadings = [
            "What's Likely Happening:",
            "Here's What You Can Do:",
            "Watch for These Signs:",
            "Suggestions for You:"
            // "Disclaimer:" handled separately
          ];
  
          const isSectionHeading = (t) =>
            sectionHeadings.some(h => t.startsWith(h));
  
          // Process messages
          session.messages.forEach((message) => {
            const sender = message.type === 'user' ? 'User' : 'OrthoBot';
            const headerBold = sender === 'OrthoBot';
            yPos = addText(`${sender} (${message.timestamp}):`, margin, yPos, { bold: headerBold, fontSize: 11 }) + 2;
  
            if (message.type === 'bot') {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = message.text;
  
              const processElement = (element) => {
                if (element.nodeType === Node.TEXT_NODE) {
                  let text = element.textContent.replace(/\s+/g, ' ').trim();
                  if (!text) return;
  
                  // Skip disclaimer-like text here (we’ll handle it once later)
                  const disclaimerLike = /^\s*(?:⚠️\s*)?Disclaimer:/i.test(text);
                  if (disclaimerLike) return;
  
                  if (isSectionHeading(text)) {
                    yPos = addText(text, margin, yPos, { bold: true, fontSize: 12 }) + 4;
                  } else {
                    yPos = addText(text, margin, yPos, { fontSize: 10 }) + 2;
                  }
                } else if (element.nodeType === Node.ELEMENT_NODE) {
                  const tag = element.tagName.toLowerCase();
  
                  if (tag === 'ul') {
                    element.querySelectorAll('li').forEach(li => {
                      const t = li.textContent.replace(/\s+/g, ' ').trim();
                      if (t) yPos = addText(`${t}`, margin, yPos, { indent: 8 }) + 2;
                    });
                    yPos += 2;
                  } else {
                    for (let child of element.childNodes) processElement(child);
                  }
                }
              };
  
              // Process main content
              for (let child of tempDiv.childNodes) {
                processElement(child);
              }
  
              // Handle Disclaimer once, clean
              if (message.text.includes('Disclaimer:')) {
                const cleanText = (s) =>
                  (s || '').replace(/\s+/g, ' ').replace(/^\s*(?:⚠️\s*)?/, '').trim();
  
                let disclaimerBody = '';
                const match = message.text.match(/Disclaimer:\s*([\s\S]*)$/i);
                if (match && match[1]) {
                  disclaimerBody = cleanText(match[1]);
                }
  
                if (disclaimerBody) {
                  yPos += 6; // spacing before disclaimer
                  yPos = addText('Disclaimer:', margin, yPos, { bold: true, fontSize: 12 }) + 2;
                  yPos = addText(disclaimerBody, margin, yPos, { fontSize: 10 }) + 2;
                }
              }
  
            } else {
              // User message
              yPos = addText(message.text, margin, yPos, { fontSize: 10 }) + 2;
            }
  
            yPos += 3; // spacing between messages
          });
  
          // Save PDF
          const fileName = session.title.replace(/[<>:"/\\|?*]/g, '').trim();
          doc.save(`${fileName}.pdf`);
        } catch (error) {
          console.error('PDF generation error:', error);
          alert('Failed to generate PDF. Please try again.');
        }
      };
  
      generatePDF();
    }
    closeContextMenu();
  };
  
  

  const handleDelete = (sessionId) => {
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    if (currentSessionId === sessionId) {
      startNewChat();
    }
    closeContextMenu();
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
  

  const handleCopyMessage = async (messageOrText) => {
    try {
      const isObject = typeof messageOrText === 'object' && messageOrText !== null;
      const text = isObject ? messageOrText.text : messageOrText;
      const isBotHtml = isObject && messageOrText.type === 'bot';
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
      setCopiedMessage(Date.now());
      setTimeout(() => setCopiedMessage(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
      // Fallback for older browsers
      const fallbackText = (typeof messageOrText === 'object' && messageOrText?.type === 'bot')
        ? convertHtmlToPlainText(messageOrText.text)
        : String(messageOrText);
      const textArea = document.createElement('textarea');
      textArea.value = fallbackText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMessage(Date.now());
      setTimeout(() => setCopiedMessage(null), 2000);
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
      {/* Navbar */}
      <Navbar />
      
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="hamburger-btn-sidebar" onClick={toggleSidebar}>
            <Menu size={20} />
          </button>
          <button className="close-btn" onClick={() => setSidebarOpen(false)}>
            ×
          </button>
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
                        <span className="session-title">{session.title}</span>
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
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <User size={20} />
            <span>Login</span>
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
            onClick={() => handleDownload(contextMenu.sessionId)}
          >
            <Download size={16} />
            Download
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
                Ask questions using voice or text!
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
                        <div dangerouslySetInnerHTML={{ __html: message.text }} />
) : (
                        <p>{message.text}</p>
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
                          {copiedMessage && Date.now() - copiedMessage < 2000 ? (
                            <Check size={14} className="copied-icon" />
                          ) : (
                            <Copy size={14} />
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
                          {copiedMessage && Date.now() - copiedMessage < 2000 ? (
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
            <input
              type="text"
              placeholder={placeholders[selectedLanguage]}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="chat-input"
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
            OrthoBot AI can make mistakes. Please consult with healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};
export default Chat;
