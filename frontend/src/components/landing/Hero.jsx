import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle, Sparkles, Code2, CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden transition-colors duration-300">
      {/* Glowing ambient light spheres */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none animate-pulse"
           style={{ background: "var(--glow-1)" }} />
      <div className="absolute top-32 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
           style={{ background: "var(--glow-2)" }} />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Headline & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Eyebrow Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 shadow-xs backdrop-blur-md"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <Sparkles className="w-4 h-4 text-purple-500 animate-spin-slow" />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              AI-Powered Code Intelligence & Audit Suite
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight"
              style={{ color: "var(--text-primary)" }}>
            Understand Code{" "}
            <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Instantly
            </span>{" "}
            with AI
          </h1>

          <p className="mt-6 text-base sm:text-lg max-w-xl leading-relaxed font-normal"
             style={{ color: "var(--text-secondary)" }}>
            Paste any code snippet, script, SQL query, or terminal command. Instantly detect bugs, optimize runtime performance, generate documentation, transpile languages, and learn CS concepts — all in one unified workspace.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/register"
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Start Free Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              style={{
                background: "var(--btn-sec-bg)",
                color: "var(--btn-sec-text)",
                border: "1px solid var(--btn-sec-border)",
              }}
              className="px-7 py-3.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <PlayCircle className="w-4 h-4 text-purple-500" />
              <span>See How It Works</span>
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 pt-8 grid grid-cols-3 gap-6" style={{ borderTop: "1px solid var(--border-clr)" }}>
            <div>
              <div className="font-extrabold text-2xl font-display" style={{ color: "var(--text-primary)" }}>14+</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>Languages Supported</div>
            </div>
            <div>
              <div className="font-extrabold text-2xl font-display text-purple-500">8</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>AI Analysis Modes</div>
            </div>
            <div>
              <div className="font-extrabold text-2xl font-display text-emerald-500">100%</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>Real-time Precision</div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Code Editor Mockup Card (Intentionally Dark for IDE look) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div className="rounded-3xl p-1.5 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 shadow-2xl shadow-purple-500/10">
            <div className="rounded-2xl overflow-hidden bg-gray-950 text-gray-100 font-mono shadow-2xl">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs text-gray-400 font-mono flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" /> findDuplicates.js
                  </span>
                </div>
                <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                  🔍 AUTO DETECT
                </span>
              </div>

              {/* Code Snippet */}
              <div className="p-5 text-[13px] leading-relaxed overflow-x-auto text-gray-300">
                <p><span className="text-purple-400">function</span> <span className="text-cyan-400">findDuplicates</span>(<span className="text-amber-300">arr</span>) {"{"}</p>
                <p className="pl-4"><span className="text-purple-400">const</span> seen = <span className="text-blue-400">new Set()</span>;</p>
                <p className="pl-4"><span className="text-purple-400">const</span> dupes = [];</p>
                <p className="pl-4"><span className="text-purple-400">for</span> (<span className="text-purple-400">const</span> n <span className="text-purple-400">of</span> arr) {"{"}</p>
                <p className="pl-8 text-emerald-400">seen.has(n) ? dupes.push(n) : seen.add(n);</p>
                <p className="pl-4">{"}"}</p>
                <p className="pl-4"><span className="text-purple-400">return</span> dupes;</p>
                <p>{"}"}</p>
              </div>

              {/* Live AI Analysis Badge Card */}
              <div className="p-4 bg-gray-900/90 border-t border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-sans font-bold text-white">AI Engine Report</span>
                  </div>
                  <span className="text-[10px] font-sans text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> O(n) Optimal
                  </span>
                </div>
                <p className="text-xs font-sans text-gray-400 leading-normal mb-3">
                  Linear time set lookup prevents O(n²) nested loop overhead. Zero bugs detected.
                </p>

                {/* Metric Pills */}
                <div className="grid grid-cols-3 gap-2 text-center font-sans text-[11px]">
                  <div className="bg-purple-950/60 border border-purple-800/40 rounded-xl p-2 text-purple-300">
                    <span className="block text-[10px] text-gray-400">Maintainability</span>
                    <strong className="text-sm font-extrabold text-purple-300">94%</strong>
                  </div>
                  <div className="bg-blue-950/60 border border-blue-800/40 rounded-xl p-2 text-blue-300">
                    <span className="block text-[10px] text-gray-400">Performance</span>
                    <strong className="text-sm font-extrabold text-blue-300">92%</strong>
                  </div>
                  <div className="bg-cyan-950/60 border border-cyan-800/40 rounded-xl p-2 text-cyan-300">
                    <span className="block text-[10px] text-gray-400">Security</span>
                    <strong className="text-sm font-extrabold text-cyan-300">98%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
