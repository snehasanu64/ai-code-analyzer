import { motion } from "framer-motion";
import { FolderClock, FileCode2, PanelRightOpen, CheckCircle2, ShieldCheck } from "lucide-react";

export default function DemoPreview() {
  return (
    <section id="demo" className="relative py-20 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-primary)",
            }}
          >
            Workspace Preview
          </span>
          <h2 className="mt-4 font-display font-extrabold text-3xl sm:text-4xl tracking-tight"
              style={{ color: "var(--text-primary)" }}>
            Built like an IDE, not a chat prompt
          </h2>
          <p className="mt-3 text-base font-normal" style={{ color: "var(--text-secondary)" }}>
            History Ledger on the left, Monaco Code Editor in the center, and structured AI Insights on the right — so context is never lost.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl p-2 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 shadow-2xl shadow-purple-500/10"
        >
          <div className="rounded-2xl overflow-hidden bg-gray-950 grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] text-gray-100 font-sans border border-gray-800">
            {/* Left Ledger */}
            <div className="border-b lg:border-b-0 lg:border-r border-gray-800 p-5 bg-gray-900/60 hidden sm:block">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                <FolderClock className="w-3.5 h-3.5 text-purple-400" /> Analysis Ledger
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {["Explain Report", "Bug Report", "Optimize Report", "Security Scan", "Complexity Audit"].map((item, idx) => (
                  <div
                    key={item}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between cursor-default ${
                      idx === 0
                        ? "bg-purple-950/80 border-purple-800/80 text-purple-200"
                        : "bg-gray-900/40 border-gray-800/60 text-gray-400"
                    }`}
                  >
                    <span>{item}</span>
                    <span className="text-[10px] text-gray-500">8/14</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center Editor */}
            <div className="p-6 font-mono text-xs leading-relaxed bg-gray-950 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-3 border-b border-gray-800 font-sans">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-cyan-400" /> quicksort.py
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-800 text-gray-300">
                    PYTHON 3.11
                  </span>
                </div>
                <pre className="text-gray-300 whitespace-pre-wrap text-[13px] leading-relaxed">
{`def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)`}
                </pre>
              </div>

              <div className="mt-6 pt-3 border-t border-gray-900 flex items-center gap-2 font-sans text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> 1-Click Code Formatting & Refactoring Ready
              </div>
            </div>

            {/* Right Insights Panel */}
            <div className="border-t lg:border-t-0 lg:border-l border-gray-800 p-5 bg-gray-900/80 font-sans">
              <div className="flex items-center justify-between text-xs font-bold text-white mb-4 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <PanelRightOpen className="w-4 h-4 text-purple-400" /> AI Insights Report
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Safe
                </span>
              </div>

              <div className="space-y-4 text-xs text-gray-300">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Algorithm Strategy</span>
                  <p className="text-gray-200 leading-snug">Divide-and-Conquer quicksort pattern using pivot partitioning.</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Complexity Bounds</span>
                  <p className="text-gray-200 leading-snug">Time: <code className="text-blue-300">O(n log n)</code> avg | Space: <code className="text-blue-300">O(n)</code> recursive stack.</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">SAST Vulnerabilities</span>
                  <p className="text-gray-200 leading-snug">0 security flaws flagged. Safe algorithm baseline.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
