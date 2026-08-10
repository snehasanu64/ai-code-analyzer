import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ClipboardList, XCircle, Loader2, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { marked } from "marked";

function ScoreBar({ label, value, colorClass }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{label}</span>
        <span className="font-semibold text-gray-700">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Block({ emoji, title, children }) {
  return (
    <div className="mb-7">
      <h3 className="font-display font-bold text-[15px] text-gray-900 mb-2.5 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h3>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}

function Markdown({ markdown }) {
  return (
    <div
      className="markdown-body text-sm text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: marked.parse(markdown || "") }}
    />
  );
}

function CodeBlock({ code, language }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-100 text-xs mb-4">
      <SyntaxHighlighter language={language || "javascript"} style={oneLight} customStyle={{ margin: 0, fontSize: "12px", background: "#F9FAFB" }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function ConversionBlock({ convertedCode, targetLanguage, onApplyConvertedCode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!convertedCode) return;
    await navigator.clipboard.writeText(convertedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6">
      <div className="p-3 bg-violet-50 border border-violet-100 rounded-2xl flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="text-xs font-semibold text-violet-900 flex items-center gap-1.5">
          <span>🔁</span> Converted to {targetLanguage ? targetLanguage.toUpperCase() : "Target Language"}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ClipboardList className="w-3.5 h-3.5 text-violet-600" />}
            {copied ? "Copied!" : "Copy Code"}
          </button>
          {onApplyConvertedCode && (
            <button
              onClick={() => onApplyConvertedCode(convertedCode, targetLanguage)}
              className="px-3 py-1.5 bg-primary text-white hover:bg-violet-700 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
              title="Replace code in center workspace editor with converted code"
            >
              <Sparkles className="w-3.5 h-3.5" /> Apply to Editor
            </button>
          )}
        </div>
      </div>
      <CodeBlock code={convertedCode} language={targetLanguage || "javascript"} />
    </div>
  );
}

function OptimizedBlock({ optimizedCode, language, onApplyConvertedCode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!optimizedCode) return;
    await navigator.clipboard.writeText(optimizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6">
      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
          <span>⚡</span> Optimized Implementation
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />}
            {copied ? "Copied!" : "Copy Code"}
          </button>
          {onApplyConvertedCode && (
            <button
              onClick={() => onApplyConvertedCode(optimizedCode, language)}
              className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
              title="Replace code in center workspace editor with optimized code"
            >
              <Sparkles className="w-3.5 h-3.5" /> Apply to Editor
            </button>
          )}
        </div>
      </div>
      <CodeBlock code={optimizedCode} language={language || "javascript"} />
    </div>
  );
}

function renderContent(analysis, onApplyConvertedCode) {
  const { type, result, targetLanguage } = analysis;
  switch (type) {
    case "explain":
      return (
        <>
          <Markdown markdown={result.markdown} />
          {!!result.algorithms?.length && (
            <Block emoji="🧠" title="Algorithms">
              <ul className="list-disc pl-5 space-y-1">{result.algorithms.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </Block>
          )}
          {!!result.dataStructures?.length && (
            <Block emoji="🗂️" title="Data Structures">
              <p>{result.dataStructures.join(", ")}</p>
            </Block>
          )}
        </>
      );
    case "bugs":
    case "complexity":
    case "security":
      return <Markdown markdown={result.markdown} />;
    case "optimize":
      return (
        <>
          <Markdown markdown={result.markdown} />
          {result.optimizedCode && (
            <OptimizedBlock
              optimizedCode={result.optimizedCode}
              language={analysis.language}
              onApplyConvertedCode={onApplyConvertedCode}
            />
          )}
        </>
      );
    case "documentation":
      return (
        <>
          <Markdown markdown={result.markdown} />
          {result.readme && (
            <Block emoji="📘" title="README stub">
              <CodeBlock code={result.readme} language="markdown" />
            </Block>
          )}
        </>
      );
    case "conversion":
      return (
        <>
          <ConversionBlock
            convertedCode={result.convertedCode}
            targetLanguage={targetLanguage}
            onApplyConvertedCode={onApplyConvertedCode}
          />
          <Markdown markdown={result.markdown} />
        </>
      );
    case "learning":
      return <Markdown markdown={result.markdown} />;
    default:
      return null;
  }
}

function analysisToPlainText(analysis) {
  const lines = [`AI Code Analyzer — ${analysis.type.toUpperCase()} REPORT`, `Language: ${analysis.language}`, ""];
  if (analysis.scores) {
    lines.push("Scores:");
    Object.entries(analysis.scores).forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
    lines.push("");
  }
  lines.push(JSON.stringify(analysis.result, null, 2));
  return lines.join("\n");
}

export default function RightPanel({ analysis, loading, onClear, onApplyConvertedCode }) {
  const handleCopyLogs = async () => {
    if (!analysis) return;
    await navigator.clipboard.writeText(analysisToPlainText(analysis));
  };

  return (
    <aside className="w-full lg:w-[420px] shrink-0 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-gray-900">AI Insights Report</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleCopyLogs} disabled={!analysis} className="light-btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40">
            <ClipboardList className="w-3.5 h-3.5" /> Copy Logs
          </button>
          <button onClick={onClear} disabled={!analysis} className="light-btn-secondary !px-3 !py-1.5 text-xs !text-red-500 disabled:opacity-40">
            <XCircle className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" />
            <p className="text-sm text-gray-500">Running the analysis engine...</p>
          </div>
        ) : analysis ? (
          <AnimatePresence mode="wait">
            <motion.div key={analysis._id || analysis.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {analysis.scores && (
                <Block emoji="📈" title="Scores">
                  <div className="space-y-3">
                    <ScoreBar label="Code Quality" value={analysis.scores.quality} colorClass="bg-primary" />
                    <ScoreBar label="Performance" value={analysis.scores.performance} colorClass="bg-secondary" />
                    <ScoreBar label="Security" value={analysis.scores.security} colorClass="bg-accent" />
                    <ScoreBar label="Maintainability" value={analysis.scores.maintainability} colorClass="bg-emerald-500" />
                  </div>
                </Block>
              )}
              {renderContent(analysis, onApplyConvertedCode)}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 max-w-[220px]">
              Select an action and run the analysis engine to see your AI insights here.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
