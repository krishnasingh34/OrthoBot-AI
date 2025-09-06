# OrthoBot AI – Virtual Healthcare Assistant for Post-Op Care

**OrthoBot AI** is a virtual healthcare assistant built with **React (frontend)** and **Node.js (backend)**. It provides AI-powered recovery guidance, rehab routines, diet plans, and real-time chat support for patients after orthopedic surgery.

---

## 📑 Table of Contents

1. [Features](#-features)  
2. [Tech Stack](#-tech-stack)  
   - [Frontend](#frontend)  
   - [Backend](#backend)  
3. [Project Structure](#-project-structure)  
4. [Prerequisites](#-prerequisites)  
5. [Quick Start](#-quick-start)  
   - [Clone and Install](#1-clone-and-install)  
   - [Backend Setup](#2-backend-setup)  
   - [Start Development Servers](#3-start-development-servers)  
6. [Configuration](#-configuration)  
   - [Environment Variables](#environment-variables)  
7. [MongoDB Atlas Setup Guide](#-mongodb-atlas-setup-guide)  
   - [Step-by-Step MongoDB Atlas Configuration](#step-by-step-mongodb-atlas-configuration)  
   - [8. Database Structure](#8-database-structure)  
   - [Security Best Practices](#security-best-practices)  
8. [Troubleshooting](#-troubleshooting)  
9. [License](#-license)  
10. [Contributing](#-contributing)  
11. [Support](#-support)  


---

## 🚀 Features

- **AI-Powered Chatbot**: Provides instant answers to patient queries
- **Knowledge Base Integration**: Delivers accurate rehab routines, diet plans, and post-op care guidance
- **Voice & Translation Support**: Enables voice-enabled conversations with real-time language translation
- **User Authentication**: Secure login/signup powered by Clerk
- **Responsive Design**: React-based frontend designed for smooth, mobile-friendly patient experience

---

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
- MongoDB Atlas (cloud database) 
---

## 📂 Project Structure

```
orthobot-ai/
├── frontend/       # React + Vite (UI, Clerk auth, voice features)
├── backend/        # Node.js + Express (APIs, MongoDB, Groq AI)
├── README.md       # Project documentation
└── package.json    # Root config for scripts
```

---

## 📋 Prerequisites

- Node.js (v16 or higher)  
- npm or yarn  
- Groq API key → [Get one here](https://console.groq.com/)  
- MongoDB Atlas account → [Sign up here](https://cloud.mongodb.com)  

---

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

# Copy example file
cp .env.example .env

# Edit .env with your API key
# GROQ_API_KEY=your_actual_groq_api_key_here
# PORT=3000
```

Or use the Windows setup script:
```bash
npm run setup:env
```

### 3. Start Development Servers
```bash
# Run both frontend and backend simultaneously
npm run dev:full

# Or run separately:
# Terminal 1: npm run dev (frontend on :5173)
# Terminal 2: npm run backend (backend on :3000)
```

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file inside the `backend/` folder:

```env
GROQ_API_KEY=your_actual_groq_api_key_here
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/orthobot
PORT=3000
```

---

## 🍃 MongoDB Atlas Setup Guide

### Step-by-Step MongoDB Atlas Configuration
1. Create an Atlas account → [cloud.mongodb.com](https://cloud.mongodb.com)  
2. Create free cluster (M0, AWS recommended)  
3. Configure Database User + Network Access  
4. Copy connection string (Node.js driver)  
5. Add to `.env` as `MONGODB_URI`  

---

### 8. Database Structure

#### `SharedChats` Collection
```javascript
{
  shareId: "uuid-string",
  shareType: "full_chat" | "single_message",
  title: "Chat title",
  messages: [...],
  singleMessage: {...},
  createdAt: Date,
  viewCount: Number,
  expiresAt: Date
}
```

---

### Security Best Practices
- Never commit `.env` to GitHub  
- Restrict IPs in production  
- Use strong DB passwords & rotate regularly  

---

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
