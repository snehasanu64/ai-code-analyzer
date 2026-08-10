import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, User, LogOut, Settings } from "lucide-react";
import LeftPanel from "../components/dashboard/LeftPanel.jsx";
import CenterPanel from "../components/dashboard/CenterPanel.jsx";
import RightPanel from "../components/dashboard/RightPanel.jsx";
import WorkspaceKeysModal from "../components/dashboard/WorkspaceKeysModal.jsx";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const DEFAULT_CODE = `function findDuplicates(arr) {
  const seen = new Set();
  const dupes = [];
  for (const n of arr) {
    seen.has(n) ? dupes.push(n) : seen.add(n);
  }
  return dupes;
}`;

const ENDPOINTS = {
  explain: { url: "/analysis/explain", buildBody: (ctx) => ({ code: ctx.code, language: ctx.language, level: ctx.level }) },
  bugs: { url: "/bugs/detect", buildBody: (ctx) => ({ code: ctx.code, language: ctx.language }) },
  optimize: { url: "/optimize", buildBody: (ctx) => ({ code: ctx.code, language: ctx.language }) },
  complexity: { url: "/complexity", buildBody: (ctx) => ({ code: ctx.code, language: ctx.language }) },
  security: { url: "/security/scan", buildBody: (ctx) => ({ code: ctx.code, language: ctx.language }) },
  documentation: { url: "/docs/generate", buildBody: (ctx) => ({ code: ctx.code, language: ctx.language }) },
  conversion: { url: "/convert", buildBody: (ctx) => ({ code: ctx.code, fromLanguage: ctx.language, toLanguage: ctx.targetLanguage }) },
  learning: { url: "/learn", buildBody: (ctx) => ({ code: ctx.code, language: ctx.language, mode: "eli10" }) },
};

export default function Workspace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("javascript");
  const [level, setLevel] = useState("intermediate");
  const [targetLanguage, setTargetLanguage] = useState("python");
  const [selectedAction, setSelectedAction] = useState("explain");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [keysOpen, setKeysOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const runAction = async () => {
    if (!selectedAction) return;
    setLoading(true);
    setError("");
    setWarning("");
    try {
      const { url, buildBody } = ENDPOINTS[selectedAction];
      const { data } = await api.post(url, buildBody({ code, language, level, targetLanguage }));
      setAnalysis(data.analysis);
      setRefreshTrigger((n) => n + 1);
      if (data.warning) setWarning(`Your configured AI provider failed, so this used the sandbox engine instead: ${data.warning}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadSnippet = (loadedAnalysis) => {
    if (!loadedAnalysis) return;
    setCode(loadedAnalysis.sourceCode);
    setLanguage(loadedAnalysis.language);
    setAnalysis(loadedAnalysis);
    setSelectedAction(loadedAnalysis.type);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col light-shell">
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-gray-900 leading-tight">AI Code Analyzer</p>
            <p className="text-[10px] text-gray-400 leading-tight">Code Analysis &amp; Audit Suite</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button onClick={() => navigate("/profile")} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900">
            <User className="w-3.5 h-3.5" /> {user?.name}
          </button>
          <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>



      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <LeftPanel onLoadSnippet={loadSnippet} refreshTrigger={refreshTrigger} />
        <CenterPanel
          code={code}
          setCode={setCode}
          language={language}
          setLanguage={setLanguage}
          level={level}
          setLevel={setLevel}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          onRun={runAction}
          loading={loading}
        />
        <RightPanel
          analysis={analysis}
          loading={loading}
          onClear={() => setAnalysis(null)}
          onApplyConvertedCode={(newCode, newLang) => {
            setCode(newCode);
            if (newLang) setLanguage(newLang);
          }}
        />
      </div>

      <WorkspaceKeysModal open={keysOpen} onClose={() => setKeysOpen(false)} />
    </div>
  );
}
