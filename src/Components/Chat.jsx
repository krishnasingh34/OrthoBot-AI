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

  // Load chat sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('orthobotChatSessions');
    if (savedSessions) {
      setChatSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save chat sessions to localStorage whenever sessions change
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('orthobotChatSessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  // Filter chat sessions based on search query
  const filteredChatSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setIsWelcomeScreen(false);
      const newMessage = {
        id: Date.now(),
        type: 'user',
        text: inputValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      
      // Create or update chat session
      if (!currentSessionId) {
        const newSessionId = Date.now().toString();
        const newSession = {
          id: newSessionId,
          title: inputValue.length > 30 ? inputValue.substring(0, 30) + '...' : inputValue,
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
      
      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          text: "I'm here to help with your orthopedic concerns, though I'm experiencing some technical difficulties right now. General recovery principles: Follow your healthcare provider's specific instructions, take prescribed medications as directed, attend all scheduled appointments and therapy sessions, gradually increase activity levels as recommended, listen to your body and don't push through severe pain.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const finalMessages = [...updatedMessages, botResponse];
        setMessages(finalMessages);
        
        // Update session with bot response
        setChatSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, messages: finalMessages, lastUpdated: new Date().toISOString() }
            : session
        ));
      }, 1000);
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
    setMessages([]);
    setIsWelcomeScreen(true);
    setInputValue('');
    setCurrentSessionId(null);
  };

  const loadChatSession = (sessionId) => {
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

  const handleDownload = (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      const chatData = {
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        lastUpdated: session.lastUpdated
      };
      const dataStr = JSON.stringify(chatData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      link.click();
      URL.revokeObjectURL(url);
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
          <button className="close-btn">
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

          <div className="chat-history-section">
            <h3 className="section-title">Chat History</h3>
            <div className="chat-history-list">
              {filteredChatSessions.length > 0 ? (
                filteredChatSessions.map((session) => (
                  <div 
                    key={session.id} 
                    className={`chat-history-item ${currentSessionId === session.id ? 'active' : ''} ${session.pinned ? 'pinned' : ''}`}
                    onClick={() => loadChatSession(session.id)}
                    onContextMenu={(e) => handleContextMenu(e, session.id)}
                  >
                    <MessageSquare size={16} />
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
                      <MessageSquare size={16} />
                      <div className="search-result-content">
                        <div className="search-result-title">{session.title}</div>
                        <div className="search-result-preview">
                          {session.messages.length > 0 
                            ? session.messages[session.messages.length - 1].text.substring(0, 100) + '...'
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

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <button className="menu-btn" onClick={toggleSidebar}>
            <Menu size={20} />
          </button>
          <div className="chat-title">
            <span>New Chat</span>
          </div>
          <div className="chat-actions">
            <button className="action-btn">
              <Settings size={16} />
            </button>
          </div>
        </div>

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
                      <p>{message.text}</p>
                    </div>
                    <span className="message-time">{message.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <div className="input-container">
            <input
              type="text"
              placeholder="अपनी हिंदी, गुजराती या कोई भी सवाल यहाँ लिखें या बोलें..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="chat-input"
            />
            <div className="input-actions">
              <select className="language-selector">
                <option value="hi">हिं</option>
                <option value="en">En</option>
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
