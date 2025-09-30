// Frontend service for chat history management
class ChatHistoryService {
  constructor(authService = null) {
    this.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    this.authService = authService;
  }

  // Get user ID from authenticated user or fallback to localStorage
  getUserId() {
    if (this.authService && this.authService.isAuthenticated()) {
      return this.authService.getUserId();
    }
    
    // Fallback to localStorage for backward compatibility
    let userId = localStorage.getItem('orthobotUserId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('orthobotUserId', userId);
    }
    return userId;
  }
  
  // Get authorization headers if user is authenticated
  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authService && this.authService.isAuthenticated()) {
      return { ...headers, ...this.authService.getAuthHeaders() };
    }
    return headers;
  }

  // Create new chat session
  async createNewChat(title = null, sessionType = 'text_chat') {
    try {
      const response = await fetch(`${this.baseURL}/api/chat/new`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId: this.getUserId(),
          title,
          sessionType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create new chat');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw error;
    }
  }

  // Get user's chat history
  async getUserChatHistory(limit = 20, skip = 0) {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.baseURL}/api/chat/history/${userId}?limit=${limit}&skip=${skip}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  // Get full chat conversation
  async getChatConversation(chatId) {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.baseURL}/api/chat/${chatId}?userId=${userId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat conversation');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching chat conversation:', error);
      throw error;
    }
  }

  // Send message and get AI response
  async sendMessage(query, chatId = null, source = 'text', sessionId = null) {
    try {
      const response = await fetch(`${this.baseURL}/api/chat/message`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          query,
          userId: this.getUserId(),
          chatId,
          source,
          sessionId,
          useConversationalAgent: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Update chat title
  async updateChatTitle(chatId, newTitle) {
    try {
      const response = await fetch(`${this.baseURL}/api/chat/${chatId}/title`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          title: newTitle,
          userId: this.getUserId()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update chat title');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  }

  // Delete chat
  async deleteChat(chatId) {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.baseURL}/api/chat/${chatId}?userId=${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  // Save voice conversation to chat history
  async saveVoiceConversation(conversationHistory, sessionMetadata = {}) {
    try {
      const response = await fetch(`${this.baseURL}/api/chat/voice/save`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId: this.getUserId(),
          conversationHistory,
          sessionMetadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save voice conversation');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving voice conversation:', error);
      throw error;
    }
  }

  // Get or create active chat
  async getOrCreateActiveChat() {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.baseURL}/api/chat/active/${userId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to get active chat');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting active chat:', error);
      throw error;
    }
  }

  // Get chat statistics
  async getChatStats() {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.baseURL}/api/chat/stats/${userId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat stats');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching chat stats:', error);
      throw error;
    }
  }

  // Extract intent from user message for chat titles
  extractIntent(text) {
    const cleanText = text.toLowerCase().trim();
    
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
    
    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      if (keywords.some(keyword => cleanText.includes(keyword))) {
        return intent;
      }
    }
    
    const medicalTerms = ['surgery', 'recovery', 'pain', 'therapy', 'exercise', 'treatment', 'injury', 'healing'];
    const foundTerm = medicalTerms.find(term => cleanText.includes(term));
    
    if (foundTerm) {
      return foundTerm.charAt(0).toUpperCase() + foundTerm.slice(1) + ' question';
    }
    
    return 'General consultation';
  }

  // Convert localStorage format to new format for migration
  migrateLocalStorageChats() {
    try {
      const savedSessions = localStorage.getItem('orthobotChatSessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        console.log('Found local chat sessions to migrate:', sessions.length);
        
        // You can implement migration logic here if needed
        // For now, we'll keep both systems running in parallel
        return sessions;
      }
      return [];
    } catch (error) {
      console.error('Error migrating localStorage chats:', error);
      return [];
    }
  }
}

export default ChatHistoryService;
