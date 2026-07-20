# VoxTutor — AI Mock Interview Platform

Practice domain-specific interviews with an AI voice interviewer. Get real feedback reports.

## Tech Stack

- **Frontend**: React 18, Vite, React Router v6, TailwindCSS
- **Backend**: Express.js, Node.js, MongoDB (Mongoose)
- **AI**: Google Gemini (question generation + feedback), Vapi (voice interviews)
- **Database**: MongoDB Atlas
- **Auth**: Firebase Auth (email + Google) with server-side session cookies

## Project Structure

```
Vox-Tutor-main/
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/ # UI components (ui/, dashboard/, interview/, common/)
│   │   ├── pages/      # Page components (Home, SignIn, Dashboard, Interview, Feedback)
│   │   ├── layouts/    # Layout wrappers (AuthLayout, RootLayout)
│   │   ├── hooks/      # Custom hooks (useAuth)
│   │   ├── services/   # API service layer
│   │   ├── config/     # Firebase client config (Auth only)
│   │   └── lib/        # Constants and utilities
│   └── public/         # Static assets
│
├── backend/            # Express.js backend
│   ├── config/         # Firebase Admin (Auth) + MongoDB connection
│   ├── models/         # Mongoose schemas (User, Interview, Feedback)
│   ├── controllers/    # Route handlers (auth, interview, feedback, transcript, generate)
│   ├── middleware/     # Auth middleware
│   └── routes/         # Express route definitions
│
└── package.json        # Root workspace scripts
```

## Setup

1. **Clone and install**:
   ```bash
   git clone <repo-url>
   cd Vox-Tutor-main
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Configure environment**:
   ```bash
   # Frontend — fill in frontend/.env
   cp frontend/.env.example frontend/.env

   # Backend — fill in backend/.env
   cp backend/.env.example backend/.env
   ```

3. **Run development servers** (two terminals):
   ```bash
   # Terminal 1
   npm run dev:frontend

   # Terminal 2
   npm run dev:backend
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## Features

- 🎙️ **Voice Interviews** — AI voice agent (Vapi) conducts real-time interviews
- 🤖 **Adaptive Questions** — Gemini AI generates domain-specific questions
- 📊 **Feedback Reports** — Scored across 4 categories with actionable insights
- 📋 **Interview History** — Track progress across all sessions
- 🔐 **Auth** — Email/password + Google sign-in via Firebase
- 🌐 **6 Domains** — Software Engineering, Finance, Marketing, Product, Data Science, Consulting
