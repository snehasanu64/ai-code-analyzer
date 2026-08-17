# ⚡ AI Code Analyzer

> **An Intelligent Full-Stack Code Analysis, Auditing & Optimization Platform**

[![Live Application](https://img.shields.io/badge/🚀_Live_Application-Online-7c3aed?style=for-the-badge)](https://ai-code-analyzer-5l5p.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

**AI Code Analyzer** is a modern MERN application designed to help developers understand, audit, optimize, and secure source code. It features **8 AI-powered analysis modes**, an interactive **Monaco Code Editor**, a natural language **AI chatbot assistant**, secure **email OTP authentication**, and custom workspace API key management.

---

## 🌐 Live Web Application
👉 **[https://ai-code-analyzer-5l5p.onrender.com](https://ai-code-analyzer-5l5p.onrender.com)**

---

## 🚀 Key Features

* **🔐 Confidential Email OTP Auth**: Secure two-step registration & login with high-speed transactional email dispatch delivering 6-digit verification codes directly to the user's inbox in **< 1.5 seconds**. Includes master access fallback (`998877`).
* **📖 1. Explain Code**: Comprehensive code breakdowns tailored to **Beginner**, **Intermediate**, or **Expert** developer levels.
* **🐛 2. Audit Bugs**: Static & AI-powered bug detection scanning **30+ bug patterns** across JS/TS, Python, C/C++, Java, SQL, and generic code.
* **⚡ 3. Optimize Performance**: Identifies runtime bottlenecks, calculates Big-O bounds ($O(n)$, $O(1)$), and generates refactored code.
* **📊 4. Complexity Analysis**: Detailed time & space complexity breakdowns with step-by-step mathematical reasoning.
* **🛡️ 5. Security Scan**: Audits code for SQL Injection, XSS, CSRF, hardcoded secrets, unvalidated inputs, and buffer overflow risks.
* **📄 6. Generate Documentation**: Automates symbol extraction (JS functions, arrow functions, Python `def`, C++ signatures, classes) into clean JSDoc/Docstring specs.
* **🔁 7. Transpile / Convert Language**: Idiomatic conversion between 10+ programming languages with **Copy Code** and **Apply to Editor** shortcuts.
* **🎓 8. Interactive Learning Mode**: Generates ELI10 analogies, step-by-step mechanics, real-world use-cases, technical interview questions, and quizzes.
* **🤖 Floating AI Code Chatbot**: Interactive home-page assistant (`CodeChatbot.jsx`) for generating code snippets from natural language prompts.
* **💻 Monaco Code Editor**: Full syntax highlighting, line numbers, automatic theme switching (Dark/Light mode), and code formatting.

---

## 🛠️ Tech Stack

* **Frontend:** React 18 (Vite), Tailwind CSS, Framer Motion, Monaco Code Editor (`@monaco-editor/react`), React Syntax Highlighter, Lucide React, Axios, React Router DOM.
* **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose), JWT Authentication, Nodemailer, Brevo REST API, Resend REST API.
* **AI Engine:** OpenAI REST Provider (`gpt-3.5-turbo`) + Multilingual Static Sandbox Fallback Engine.

---

## 📂 Project Structure

```text
ai-code-analyzer/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas connection setup
│   ├── controllers/              # Auth, Analysis, Bug Detection, Chat controllers
│   ├── middleware/               # Auth (JWT), aiConfig key resolution, Error handlers
│   ├── models/                   # Mongoose models (User, Analysis, History, Feedback)
│   ├── routes/                   # REST API route endpoints
│   ├── services/
│   │   ├── aiService.js          # Central AI provider resolution & sandbox fallback
│   │   └── providers/            # mockProvider, openaiProvider, geminiProvider, claudeProvider
│   ├── utils/                    # sendEmail (Brevo & Resend APIs), crypto encryption helpers
│   └── server.js                 # Express server bootstrap & static asset serving
└── frontend/
    ├── src/
    │   ├── pages/                # Landing, Register, Login, Workspace, Profile, NotFound
    │   ├── components/
    │   │   ├── landing/          # Hero, Features, Languages, DemoPreview, HowItWorks, CodeChatbot
    │   │   ├── dashboard/        # LeftPanel (History), CenterPanel (Monaco), RightPanel (AI Reports)
    │   │   └── shared/           # Navbar
    │   ├── context/              # AuthContext, ThemeContext
    │   ├── api/                  # Axios instance with auth interceptor
    │   └── routes/               # ProtectedRoute
    └── tailwind.config.js
```

---

## ⚙️ Environment Variables Setup

### Backend (`backend/.env`)

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/ai_code_analyzer

# JWT Secret Keys
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Encryption Key for Custom Workspace Keys
ENCRYPTION_KEY=your_64_char_hex_key

# Transactional Email Providers (Ultra-Fast OTP Dispatch)
BREVO_API_KEY=xkeysib-your_brevo_api_key_here
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_USER=your_email_id_here
EMAIL_PASS=your_app_password

# Global AI Provider Configuration (openai | gemini | claude | mock)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your_openai_key_here
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5001/api
```

---

## 🏃 Local Development Setup

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
*(Backend runs on `http://localhost:5001`)*

### 2. Start Frontend App
```bash
cd frontend
npm install
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 🌐 Production Deployment (Render)

1. Connect your repository (`https://github.com/snehasanu64/ai-code-analyzer.git`) on your cloud host.
2. Set Build Command: `npm run build`
3. Set Start Command: `npm start` (or `node backend/server.js`)
4. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `BREVO_API_KEY`, `OPENAI_API_KEY`, `NODE_ENV=production`.
