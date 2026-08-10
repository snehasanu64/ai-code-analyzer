import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-28 pb-10 px-6 overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-16 left-1/4 w-72 h-72 rounded-full blur-[100px] animate-float-slow"
           style={{ background: "var(--glow-1)" }} />
      <div className="absolute top-24 right-1/4 w-72 h-72 rounded-full blur-[100px] animate-float"
           style={{ background: "var(--glow-2)" }} />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
               style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              AI-powered code intelligence
            </span>
          </div>

          <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight"
              style={{ color: "var(--text-primary)" }}>
            Understand Code{" "}
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Instantly
            </span>{" "}
            with AI
          </h1>

          <p className="mt-6 text-lg max-w-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Paste code, detect bugs, optimize performance, generate documentation, convert languages and learn concepts — all in one workspace.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="btn-primary">
              Start Analyzing <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#demo" className="btn-secondary">
              <PlayCircle className="w-4 h-4" /> View Demo
            </a>
          </div>

          {/* Stats */}
          <div className="mt-10 flex items-center gap-8 text-sm" style={{ color: "var(--text-secondary)" }}>
            <div>
              <div className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>13+</div>
              Languages
            </div>
            <div className="w-px h-8" style={{ background: "var(--border-clr)" }} />
            <div>
              <div className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>8</div>
              AI Analysis Modes
            </div>
            <div className="w-px h-8" style={{ background: "var(--border-clr)" }} />
            <div>
              <div className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>100%</div>
              Editor-native
            </div>
          </div>
        </motion.div>

        {/* Code card — stays dark (intentional for code editor look) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div className="gradient-border glass-card p-1">
            <div className="rounded-2xl overflow-hidden" style={{ background: "#0D1220" }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                <span className="ml-3 text-xs text-gray-400 font-mono">analyze.js</span>
              </div>
              <div className="p-5 font-mono text-[13px] leading-relaxed">
                <p><span className="text-blue-400">function</span> <span className="text-cyan-400">findDuplicates</span>(<span className="text-violet-400">arr</span>) {"{"}</p>
                <p className="pl-4 text-gray-400">  <span className="text-blue-400">const</span> seen = <span className="text-violet-400">new Set()</span>;</p>
                <p className="pl-4 text-gray-400">  <span className="text-blue-400">const</span> dupes = [];</p>
                <p className="pl-4 text-white">  <span className="text-blue-400">for</span> (<span className="text-blue-400">const</span> n <span className="text-blue-400">of</span> arr) {"{"}</p>
                <p className="pl-8 text-gray-400">    seen.has(n) ? dupes.push(n) : seen.add(n);</p>
                <p className="pl-4">  {"}"}</p>
                <p className="pl-4 text-blue-400">  return dupes;</p>
                <p>{"}"}</p>
              </div>
              <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs text-cyan-400 font-medium">AI Insight</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Linear-time duplicate detection using a Set — O(n) time, O(n) space. No bugs detected. Security risk: low.
                </p>
                <div className="flex gap-4 mt-3">
                  {[["Quality", 92, "#7C3AED"], ["Performance", 88, "#3B82F6"], ["Security", 96, "#06B6D4"]].map(([label, val, color]) => (
                    <div key={label} className="flex-1">
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>{label}</span>
                        <span>{val}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full" style={{ width: `${val}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-6 -right-6 glass-card px-4 py-3 hidden sm:block"
          >
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Security Scan</span>
            <div className="text-lg font-bold text-cyan-400">Passed ✓</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
