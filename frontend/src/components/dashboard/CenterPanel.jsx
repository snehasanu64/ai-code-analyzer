import { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  Upload, Download, Copy, Check, BookOpenText, Bug, Zap, FileText,
  BarChart3, ShieldCheck, Repeat, GraduationCap, TerminalSquare, Play, Loader2, Wand2,
} from "lucide-react";

const LANGUAGES = [
  "auto", "javascript", "typescript", "python", "java", "c", "cpp", "php", "html", "css", "sql", "react", "node", "nginx",
];

const LANG_DISPLAY_MAP = {
  auto: "🔍 AUTO DETECT",
  cpp: "C++",
  c: "C",
  javascript: "JAVASCRIPT",
  typescript: "TYPESCRIPT",
  python: "PYTHON",
  java: "JAVA",
  php: "PHP",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  react: "REACT",
  node: "NODE",
  nginx: "NGINX",
};

// Maps our language keys to the Monaco/highlighting language id they should actually use
const MONACO_LANG_MAP = { react: "javascript", node: "javascript" };

const THEMES = [
  { key: "obsidian-dark", label: "🌘 Obsidian Dark", base: "vs-dark" },
  { key: "nord-light", label: "❄️ Nord Light", base: "vs" },
  { key: "emerald-forest", label: "🌲 Emerald Forest", base: "vs-dark" },
  { key: "sunset-glow", label: "🌅 Sunset Glow", base: "vs-dark" },
];

const defineCustomThemes = (monaco) => {
  monaco.editor.defineTheme("nord-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8FA0B3", fontStyle: "italic" },
      { token: "keyword", foreground: "5E81AC" },
      { token: "string", foreground: "A3BE8C" },
      { token: "number", foreground: "B48EAD" },
      { token: "identifier", foreground: "3B4252" },
    ],
    colors: {
      "editor.background": "#ECEFF4",
      "editor.foreground": "#2E3440",
      "editorLineNumber.foreground": "#9CA9BD",
      "editor.lineHighlightBackground": "#E5E9F0",
      "editorCursor.foreground": "#5E81AC",
      "editor.selectionBackground": "#D8DEE9",
    },
  });
  monaco.editor.defineTheme("emerald-forest", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5C8A72", fontStyle: "italic" },
      { token: "keyword", foreground: "6EE7B7" },
      { token: "string", foreground: "A7F3D0" },
      { token: "number", foreground: "34D399" },
    ],
    colors: {
      "editor.background": "#0B1F17",
      "editor.foreground": "#D1FAE5",
      "editorLineNumber.foreground": "#3F6652",
      "editor.lineHighlightBackground": "#12291F",
      "editorCursor.foreground": "#34D399",
      "editor.selectionBackground": "#1C4433",
    },
  });
  monaco.editor.defineTheme("sunset-glow", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "B98A73", fontStyle: "italic" },
      { token: "keyword", foreground: "FB923C" },
      { token: "string", foreground: "FCA5A5" },
      { token: "number", foreground: "F472B6" },
    ],
    colors: {
      "editor.background": "#241512",
      "editor.foreground": "#FDE8D8",
      "editorLineNumber.foreground": "#7A5548",
      "editor.lineHighlightBackground": "#2E1C18",
      "editorCursor.foreground": "#FB923C",
      "editor.selectionBackground": "#4A2B22",
    },
  });
};

const ACTIONS = [
  { key: "explain", label: "Explain Code", icon: BookOpenText },
  { key: "bugs", label: "Audit Bugs", icon: Bug },
  { key: "optimize", label: "Optimize Performance", icon: Zap },
  { key: "documentation", label: "Generate Docs", icon: FileText },
  { key: "complexity", label: "Complexity Analysis", icon: BarChart3 },
  { key: "security", label: "Security Scan", icon: ShieldCheck },
  { key: "conversion", label: "Convert Language", icon: Repeat },
  { key: "learning", label: "Learning Mode", icon: GraduationCap },
];

const LEVELS = [
  { key: "beginner", label: "🤓 Beginner Friendly", caption: "Simulates simple concepts & details depending on selection." },
  { key: "intermediate", label: "💻 Intermediate Developer", caption: "Balanced technical depth for working developers." },
  { key: "expert", label: "🎓 Expert / Academic", caption: "Dense, terse, assumes strong CS fundamentals." },
];

export default function CenterPanel({
  code, setCode, language, setLanguage, level, setLevel,
  targetLanguage, setTargetLanguage, selectedAction, setSelectedAction, onRun, loading,
}) {
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [formatted, setFormatted] = useState(false);
  const [theme, setTheme] = useState("obsidian-dark");

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    const sessionCode = sessionStorage.getItem("workspace_initial_code");
    if (sessionCode) {
      sessionStorage.removeItem("workspace_initial_code");
      setCode(sessionCode);
    }
  }, [setCode]);

  const handleFormatCode = () => {
    if (!code || !code.trim()) return;

    if (editorRef.current) {
      try {
        const action = editorRef.current.getAction("editor.action.formatDocument");
        if (action) {
          action.run();
          setFormatted(true);
          setTimeout(() => setFormatted(false), 1500);
          return;
        }
      } catch (e) {}
    }

    try {
      if (language === "json" || code.trim().startsWith("{") || code.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(code);
          setCode(JSON.stringify(parsed, null, 2));
          setFormatted(true);
          setTimeout(() => setFormatted(false), 1500);
          return;
        } catch (e) {}
      }

      const lines = code.split("\n");
      let indentLevel = 0;
      const formattedLines = lines.map((line) => {
        let trimmed = line.trim();
        if (!trimmed) return "";

        if (/^[}\])]/.test(trimmed)) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        const indentedLine = "  ".repeat(indentLevel) + trimmed;

        if (/[{[(]\s*$/.test(trimmed) || /^(function|if|for|while|class|def|server\s*\{|location)\b.*[^}]*$/i.test(trimmed)) {
          indentLevel += 1;
        }

        return indentedLine;
      });

      setCode(formattedLines.join("\n"));
      setFormatted(true);
      setTimeout(() => setFormatted(false), 1500);
    } catch (err) {
      console.error("Format error:", err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCode(text);
    const ext = file.name.split(".").pop().toLowerCase();
    const extMap = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", py: "python", java: "java", c: "c", cpp: "cpp", php: "php", html: "html", css: "css", sql: "sql" };
    if (extMap[ext]) setLanguage(extMap[ext]);
  };

  const handleDownload = () => {
    const extMap = { javascript: "js", typescript: "ts", python: "py", java: "java", c: "c", cpp: "cpp", php: "php", html: "html", css: "css", sql: "sql" };
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snippet.${extMap[language] || "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCode(text);
  };

  const currentLevel = LEVELS.find((l) => l.key === level) || LEVELS[0];

  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-4 h-4 text-primary" />
          <h2 className="font-display font-bold text-gray-900">Coding Workspace</h2>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const c = code.trim();
            const hasMarkup = /<(html|div|head|body|p|span|header|footer|script|style|title)\b/i.test(c) || /<!DOCTYPE html>/i.test(c);
            const hasJs = /\b(function|const|let|var|console\.log|=>|import\s+.*from|require\(|new\s+Set)\b/.test(c);
            const hasPy = /\b(def\s+\w+|elif\b|self\.|print\(|import\s+\w+|from\s+\w+\s+import)\b/.test(c);

            if (language === "html" && hasJs && !hasMarkup) {
              return (
                <button
                  onClick={() => setLanguage("javascript")}
                  className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2.5 py-1 flex items-center gap-1 font-medium hover:bg-amber-100 transition-colors"
                  title="Click to switch language to JavaScript"
                >
                  ⚠️ Looks like JavaScript — Switch?
                </button>
              );
            }
            if (language === "html" && hasPy && !hasMarkup) {
              return (
                <button
                  onClick={() => setLanguage("python")}
                  className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2.5 py-1 flex items-center gap-1 font-medium hover:bg-amber-100 transition-colors"
                  title="Click to switch language to Python"
                >
                  ⚠️ Looks like Python — Switch?
                </button>
              );
            }
            return null;
          })()}
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 outline-none text-gray-700">
            {THEMES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 outline-none text-gray-700 uppercase font-medium">
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{LANG_DISPLAY_MAP[l] || l.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor — grows to fill all remaining vertical space */}
      <div className="flex-1 flex flex-col min-h-0 p-4 pb-1">
        <div
          className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-gray-800"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Editor
            height="100%"
            language={MONACO_LANG_MAP[language] || language}
            theme={theme}
            value={code}
            beforeMount={defineCustomThemes}
            onMount={handleEditorDidMount}
            onChange={(v) => setCode(v || "")}
            options={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13.5,
              minimap: { enabled: true },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 14 },
            }}
          />
        </div>
        <div className="flex items-center justify-end gap-1.5 pt-1.5 shrink-0">
          <button
            onClick={handleFormatCode}
            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
            title="Auto-format and beautify code indentation"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-600" />
            <span>{formatted ? "Formatted!" : "Format Code"}</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-100" title="Upload file">
            <Upload className="w-4 h-4 text-gray-500" />
          </button>
          <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
          <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-gray-100" title="Download file">
            <Download className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-gray-100" title="Copy code">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Controls — always pinned at bottom, never scrolls off */}
      <div className="shrink-0 p-3 border-t border-gray-100 bg-white">
        <div className="grid grid-cols-4 lg:grid-cols-5 gap-1.5 mb-3">
          {ACTIONS.map((a) => {
            const active = selectedAction === a.key;
            return (
              <button
                key={a.key}
                onClick={() => setSelectedAction(a.key)}
                className={`light-pill ${
                  active
                    ? "bg-primary text-white border-primary shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <a.icon className="w-4 h-4" />
                <span className="text-center leading-tight">{a.label}</span>
              </button>
            );
          })}
        </div>

        {selectedAction === "conversion" && (
          <div className="mb-3 flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600 shrink-0 w-24">Convert to:</span>
            <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-2 outline-none text-gray-700 font-medium">
              {LANGUAGES.filter((l) => l !== "auto").map((l) => (
                <option key={l} value={l}>{LANG_DISPLAY_MAP[l] || l.toUpperCase()}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold text-gray-700 shrink-0 w-16">Level:</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 outline-none text-gray-700">
            {LEVELS.map((l) => (
              <option key={l.key} value={l.key}>{l.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onRun}
          disabled={loading || !code.trim() || !selectedAction}
          className="w-full light-btn-primary !py-2.5 !rounded-xl uppercase tracking-wide text-sm disabled:opacity-40"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running Analysis...</>
          ) : (
            <><Play className="w-4 h-4 fill-white" /> Start Engine Analysis</>
          )}
        </button>
      </div>
    </div>
  );
}
