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
  Trash2
} from 'lucide-react';
import Navbar from './Navbar';
import '../CSS/Chat.css';

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
  const messagesEndRef = useRef(null);

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
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
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
          const pageHeight = 280;
          const margin = 20;
          
          // Title
          doc.setFontSize(18);
          doc.setFont(undefined, 'bold');
          doc.text(session.title, margin, yPos);
          yPos += 15;
          
          // Metadata
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.text(`Created: ${new Date(session.createdAt).toLocaleDateString()}`, margin, yPos);
          yPos += 8;
          doc.text(`Last Updated: ${new Date(session.lastUpdated).toLocaleDateString()}`, margin, yPos);
          yPos += 15;
          
          // Separator line
          doc.line(margin, yPos, 190, yPos);
          yPos += 10;
          
          // Chat History header
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.text('Chat History', margin, yPos);
          yPos += 15;
          
          // Messages
          session.messages.forEach((message, index) => {
            // Check if we need a new page
            if (yPos > pageHeight) {
              doc.addPage();
              yPos = 20;
            }
            
            // Message header
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            const sender = message.type === 'user' ? 'User' : 'OrthoBot';
            doc.text(`${sender} (${message.timestamp}):`, margin, yPos);
            yPos += 8;
            
            // Message content
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            const splitText = doc.splitTextToSize(message.text, 170);
            
            // Check if message content fits on current page
            const textHeight = splitText.length * 5;
            if (yPos + textHeight > pageHeight) {
              doc.addPage();
              yPos = 20;
            }
            
            doc.text(splitText, margin, yPos);
            yPos += textHeight + 10;
          });
          
          // Save PDF with exact session title
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
                <img src="/src/assets/favicon.png" alt="OrthoBot AI" className="avatar-img" />
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
                >
                  <div className="message-avatar">
                    {message.type === 'user' ? (
                      <User size={20} />
                    ) : (
                      <img src="/src/assets/favicon.png" alt="Bot" className="bot-avatar" />
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
                    <span className="message-time">{message.timestamp}</span>
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
              <button className="voice-btn">
                <Mic size={20} />
              </button>
              <button className="send-btn" onClick={handleSendMessage}>
                <Send size={20} />
              </button>
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
