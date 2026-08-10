import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, Copy, Check, Terminal, RefreshCw } from "lucide-react";
import api from "../../api/axios";

const QUICK_PROMPTS = [
  "React Counter Component",
  "Python File Reader & Parser",
  "Express.js REST API Endpoint",
  "SQL Query with JOIN & WHERE",
];

// Fallback code responses for instant offline / sandbox demo
const STATIC_CODE_RESPONSES = {
  counter: `// React Counter Component
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded-xl flex items-center gap-3">
      <button onClick={() => setCount(c => c - 1)} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-bold">-</button>
      <span className="text-lg font-semibold">{count}</span>
      <button onClick={() => setCount(c => c + 1)} className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg font-bold">+</button>
    </div>
  );
}`,
  python: `# Python File Reader & Parser
def read_and_parse_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            cleaned = [line.strip() for line in lines if line.strip()]
            print(f"Successfully loaded {len(cleaned)} non-empty lines.")
            return cleaned
    except FileNotFoundError:
        print(f"Error: File '{filepath}' not found.")
        return []

# Usage
lines = read_and_parse_file("data.txt")`,
  express: `// Express.js REST API Route
const express = require("express");
const router = express.Router();

// GET /api/users - Fetch user list
router.get("/users", async (req, res) => {
  try {
    const users = [
      { id: 1, name: "Alice", role: "Developer" },
      { id: 2, name: "Bob", role: "Designer" }
    ];
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;`,
  sql: `-- SQL Query with INNER JOIN & Aggregation
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    COUNT(o.id) AS total_orders,
    SUM(o.amount) AS total_spent
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.created_at >= '2026-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 1
ORDER BY total_spent DESC;`
};

export default function CodeChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 Hi! I'm your AI Code Generator. Ask me to generate code in any programming language!",
      code: null
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (userPrompt) => {
    const query = (userPrompt || input).trim();
    if (!query || loading) return;

    // Add user message
    const newMessages = [...messages, { sender: "user", text: query, code: null }];
    setMessages(newMessages);
    if (!userPrompt) setInput("");
    setLoading(true);

    try {
      // Check static offline matches first
      const lower = query.toLowerCase();
      let generatedCode = "";
      let explanation = "";

      if (lower.includes("counter") && lower.includes("react")) {
        generatedCode = STATIC_CODE_RESPONSES.counter;
        explanation = "Here is a clean React Counter component using state hooks:";
      } else if (lower.includes("file reader") || lower.includes("python parser")) {
        generatedCode = STATIC_CODE_RESPONSES.python;
        explanation = "Here is a Python file reader function with error handling:";
      } else {
        // Call backend /chat/generate endpoint for dynamic code generation
        try {
          const { data } = await api.post("/chat/generate", { prompt: query });
          generatedCode = data.code || `// Generated solution for: ${query}\nfunction solution() {\n  return true;\n}`;
          explanation = data.text || `Generated code snippet for "${query}":`;
        } catch (err) {
          console.error("Chatbot API error:", err);
          generatedCode = `// Generated Code Snippet for: ${query}\nfunction solution() {\n  console.log("Executing logic for: ${query}");\n  return true;\n}`;
          explanation = `Here is a code template for "${query}":`;
        }
      }

      setMessages([
        ...newMessages,
        {
          sender: "ai",
          text: explanation,
          code: generatedCode
        }
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          sender: "ai",
          text: "Sorry, I couldn't generate that code snippet. Please try another prompt!",
          code: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async (codeText, idx) => {
    await navigator.clipboard.writeText(codeText);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[360px] sm:w-[400px] h-[520px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Chatbot Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm leading-tight">AI Code Generator</h3>
                  <p className="text-[10px] text-violet-100">Home Assistant · Instant Code Snippets</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Quick Prompt Bar */}
            <div className="px-4 py-2 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full shrink-0 hover:border-violet-500 hover:text-violet-600 transition-colors shadow-2xs"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-violet-600 text-white rounded-br-none"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200/50 dark:border-gray-700/50"
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.code && (
                    <div className="w-full mt-2 rounded-xl overflow-hidden border border-gray-800 bg-gray-950 text-gray-100 text-[11px] shadow-md">
                      <div className="px-3 py-1.5 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-violet-400 flex items-center gap-1">
                          <Terminal className="w-3 h-3" /> Generated Code
                        </span>
                        <button
                          onClick={() => handleCopyCode(m.code, i)}
                          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedIdx === i ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 font-mono overflow-x-auto text-[11px] leading-normal text-emerald-300">
                        <code>{m.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-600" />
                  <span>Generating code...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask to generate code..."
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center disabled:opacity-40 transition-colors shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-violet-500/25 flex items-center gap-2.5 font-semibold text-xs transition-all border border-white/20"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span>AI Code Bot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </motion.button>
      )}
    </div>
  );
}
