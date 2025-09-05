import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  MessageSquare, 
  Bot, 
  User,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import '../CSS/SharedChatViewer.css';
import profileLogo from '../assets/favicon.png';

const SharedChatViewer = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [sharedChat, setSharedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSharedChat();
  }, [shareId]);

  const fetchSharedChat = async () => {
    try {
      setLoading(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/share/${shareId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('This shared chat was not found or has expired.');
        }
        throw new Error('Failed to load shared chat.');
      }

      const result = await response.json();
      setSharedChat(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const goToOrthoBot = () => {
    navigate('/chat');
  };

  if (loading) {
    return (
      <div className="shared-chat-viewer">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading shared chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-chat-viewer">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Chat Not Found</h2>
          <p>{error}</p>
          <button onClick={goToOrthoBot} className="go-to-orthobot-btn">
            <MessageSquare size={20} />
            Try OrthoBot AI
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message, index) => {
    const isBot = message.type === 'bot';
    
    return (
      <motion.div
        key={message.id || index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`shared-message ${isBot ? 'bot-message' : 'user-message'}`}
      >
        <div className="message-avatar">
          {isBot ? (
            <img src={profileLogo} alt="OrthoBot" className="bot-avatar" />
          ) : (
            <div className="user-avatar">
              <User size={16} />
            </div>
          )}
        </div>
        
        <div className="message-content">
          <div className="message-header">
            <span className="sender-name">
              {isBot ? 'OrthoBot AI' : 'User'}
            </span>
            <span className="message-time">{message.timestamp}</span>
          </div>
          
          <div className="message-text">
            {isBot ? (
              <div dangerouslySetInnerHTML={{ __html: message.text }} />
            ) : (
              <p>{message.text}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="shared-chat-viewer">
      {/* Header */}
      <div className="shared-chat-header">
        <div className="header-content">
          <div className="header-left">
            <img src={profileLogo} alt="OrthoBot AI" className="header-logo" />
            <div className="header-info">
              <h1>{sharedChat.title}</h1>
              <div className="chat-meta">
                <span className="meta-item">
                  <Calendar size={14} />
                  {formatDate(sharedChat.createdAt)}
                </span>
                <span className="meta-item">
                  <Eye size={14} />
                  {sharedChat.viewCount} views
                </span>
                <span className="meta-item">
                  <MessageSquare size={14} />
                  {sharedChat.shareType === 'full_chat' ? 
                    `${sharedChat.messages?.length || 0} messages` : 
                    'Single message'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button onClick={copyShareLink} className="copy-link-btn">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button onClick={goToOrthoBot} className="try-orthobot-btn">
              <ExternalLink size={16} />
              Try OrthoBot AI
            </button>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="shared-chat-content">
        <div className="messages-container">
          {sharedChat.shareType === 'full_chat' ? (
            sharedChat.messages?.map((message, index) => renderMessage(message, index))
          ) : (
            renderMessage(sharedChat.singleMessage, 0)
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shared-chat-footer">
        <div className="footer-content">
          <p>
            This conversation was shared from{' '}
            <strong>OrthoBot AI</strong> - Your Orthopedic Recovery Assistant
          </p>
          <button onClick={goToOrthoBot} className="start-chat-btn">
            Start Your Own Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedChatViewer;
