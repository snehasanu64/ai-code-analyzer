# AI Code Analyzer

**Understand, Analyze, Optimize, and Secure Code with AI**

A modern full-stack MERN application for AI-assisted code explanation, bug auditing, performance optimization, complexity analysis, security scanning, documentation generation, language transpilation, interactive learning, and natural language code generation.

---

## 🚀 Key Features

* **📖 Explain Code**: Detailed breakdowns tailored to **Beginner**, **Intermediate**, or **Expert** developer levels.
* **🐛 Audit Bugs**: Multi-language static bug detector covering **30+ patterns** across JavaScript/TypeScript, Python, C/C++, Java, SQL, and generic security rules (including unclosed template strings, incomplete `require`/`await` calls, buffer overflow risks, and hardcoded secrets).
* **⚡ Optimize Performance**: Identifies bottlenecks, calculates Big-O time/space complexity, and generates refactored code.
* **📊 Complexity Analysis**: Precise time ($O$) and space ($O$) complexity bounds with plain-English reasoning.
* **🛡️ Security Scan**: Detects vulnerabilities including SQL Injection, XSS, CSRF, hardcoded credentials, and unguarded inputs.
* **📄 Generate Docs**: Automatic symbol extraction supporting traditional functions, arrow functions (`const fn = () =>`), Python `def`, C/C++ type signatures, and classes — formatted into clean JSDoc/Docstring specs.
* **🔁 Convert Language**: Idiomatic transpilation between languages (CSS → Python/JS, JS → C/C++/Python/Java, etc.) with interactive **Copy Code** and **Apply to Editor** actions.
* **🎓 Learning Mode**: Custom ELI10 analogies, step-by-step mechanics, production real-world use-cases, technical interview questions, exercises, and quizzes tailored to the specific input code.
* **🤖 Home Page AI Code Bot**: A floating interactive AI chatbot assistant (`CodeChatbot.jsx`) on the home page for generating instant code snippets from natural language prompts.

---

## 🛠️ Tech Stack

* **Frontend:** React 18 (Vite), Tailwind CSS, Framer Motion, Monaco Code Editor (`@monaco-editor/react`), React Syntax Highlighter, Lucide React, Axios, React Router DOM.
* **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose), JWT Authentication, bcryptjs, Morgan, dotenv.
* **AI Providers:** OpenAI REST Provider (`gpt-3.5-turbo`) + Advanced Multilingual Static Sandbox Fallback Engine.

---

## 📂 Project Structure

```
ai-code-analyzer/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas connection setup
│   ├── controllers/              # Feature controllers (auth, analysis, bug, chat, etc.)
│   ├── middleware/               # Auth (JWT), aiConfig (key resolution), errorHandler
│   ├── models/                   # Mongoose models (User, Analysis, History, Feedback)
│   ├── routes/                   # REST API route handlers
│   ├── services/
│   │   ├── aiService.js          # Central AI provider resolution & runner layer
│   │   └── providers/            # mockProvider, openaiProvider, geminiProvider, claudeProvider
│   ├── utils/                    # analysisHelper, crypto encryption helpers
│   └── server.js                 # Express server bootstrap & API route mounting
└── frontend/
    ├── src/
    │   ├── pages/                # Landing, Register, Workspace, Profile, NotFound
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

# Encryption Key for Workspace Keys
ENCRYPTION_KEY=f1957403e688c19154aa24645f404303e799e3eb375aa239c34d661c35995d93

# Global AI Provider Configuration (openai | gemini | claude | mock)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your_openai_key_here
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
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

## 🌐 Production Deployment Guide

### Deploy Backend (Render / Railway / Heroku)
1. Set the root directory to `backend`.
2. Configure Environment Variables (`MONGO_URI`, `JWT_SECRET`, `AI_PROVIDER`, `OPENAI_API_KEY`, `CLIENT_URL`).
3. Build Command: `npm install`
4. Start Command: `npm start` (or `node server.js`)

### Deploy Frontend (Vercel / Netlify)
1. Set the root directory to `frontend`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Environment Variable: `VITE_API_URL=https://your-backend-domain.com/api`

---

## 📜 License

Distributed under the **MIT License**.
