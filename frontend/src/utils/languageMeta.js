// Shared language → color/badge mapping used across the light-theme workspace UI
export const LANGUAGE_COLORS = {
  javascript: "bg-amber-500",
  typescript: "bg-blue-600",
  python: "bg-emerald-600",
  java: "bg-orange-600",
  c: "bg-slate-600",
  cpp: "bg-indigo-600",
  php: "bg-violet-600",
  html: "bg-rose-500",
  css: "bg-sky-500",
  sql: "bg-teal-600",
  plaintext: "bg-gray-500",
};

export const langBadge = (lang) => LANGUAGE_COLORS[lang] || "bg-gray-500";

export const langInitials = (lang) => {
  if (!lang) return "??";
  const map = { javascript: "JS", typescript: "TS", python: "PY", java: "JA", cpp: "C+", plaintext: "TX" };
  return map[lang] || lang.slice(0, 2).toUpperCase();
};

export const ACTION_LABELS = {
  explain: "Explain Report",
  bugs: "Bug Report",
  optimize: "Optimize Report",
  complexity: "Complexity Report",
  security: "Security Report",
  documentation: "Docs Report",
  conversion: "Convert Report",
  learning: "Learning Report",
};
