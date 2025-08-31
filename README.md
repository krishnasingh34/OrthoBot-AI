# OrthoBot AI – Virtual healthcare assistant for post-op care

OrthoBot AI – A virtual healthcare assistant for post-op care, built with React and Node.js, featuring an AI-powered knowledge base, voice chat, and responsive UI for 24/7 recovery guidance.

## 🚀 Features

- **AI-Powered Chatbot**: Provides instant answers to patient queries
- **Knowledge Base Integration**: Delivers accurate rehab routines, diet plans, and post-op care guidance
- **Voice & Translation Support**: Enables voice-enabled conversations with real-time language translation
- **User Authentication**: Secure login/signup powered by Clerk
- **Responsive Design**: React-based frontend designed for smooth, mobile-friendly patient experience

## 🛠️ Tech Stack

### Frontend
- React 19 with Vite
- Clerk for secure login/signup with session management
- Conversational UI optimized for patient–bot interactions
- Built-in speech-to-text and text-to-speech for natural communication
- Built-in speech-to-text and text-to-speech for natural communication

### Backend
- Node.js with Express for API handling
- CORS enabled for secure frontend-backend communication
- JSON-based knowledge base for structured post-op orthopedic data
- Keyword search for relevant knowledge retrieval
- Groq API integration for AI-driven patient-friendly answers
- Environment variables for secure API key management
- Error logging and reliable response handling

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Groq API key ([Get one here](https://console.groq.com/))

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd orthobot-ai
npm run install:all
```

### 2. Backend Setup
```bash
cd backend

# Option A: Copy from example file
cp env.example .env
# Then edit .env and replace 'your_groq_api_key_here' with your actual API key

# Option B: Create manually
# Create a new file called .env with this content:
# GROQ_API_KEY=your_actual_groq_api_key_here
# PORT=3000

cd ..

# Option C: Use the setup script (Windows)
npm run setup:env
# Then edit backend/.env with your actual API key
```

### 3. Start Development Servers
```bash
# Run both frontend and backend simultaneously
npm run dev:full

# Or run separately:
# Terminal 1: npm run dev (frontend on :5173)
# Terminal 2: npm run backend (backend on :3000)
```

## 🔧 Configuration

### Environment Variables
**IMPORTANT**: You must create a `.env` file in the `backend/` directory with your Groq API key.

The file should contain:
```env
GROQ_API_KEY=your_actual_groq_api_key_here
PORT=3000
```

**Note**: Without a valid Groq API key, the AI summarization features will not work.

## 🐛 Troubleshooting

- **Backend not starting**: Check Node.js version and dependencies
- **File upload fails**: Verify file size and format
- **AI processing errors**: Check Groq API key and quota
- **CORS issues**: Ensure backend is running on port 3000
- **Missing .env file**: Create `.env` file in backend folder with your API key

## 📄 License

This project is licensed under the [MIT License](./LICENSE) © 2025 [Krishna Singh](https://github.com/krishnasingh34)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions, please check the troubleshooting section or create an issue in the repository.
