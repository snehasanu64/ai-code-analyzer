import { motion } from "framer-motion";
import { FolderClock, FileCode2, PanelRightOpen } from "lucide-react";

export default function DemoPreview() {
  return (
    <section id="demo" className="relative py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-5">
          <span className="section-eyebrow">Workspace preview</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl">Built like an IDE, not a chatbot</h2>
          <p className="mt-4 text-muted">History and projects on the left, Monaco editor in the center, structured AI insights on the right.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="gradient-border glass-card p-1"
        >
          <div className="rounded-2xl overflow-hidden bg-[#0D1220] grid grid-cols-1 lg:grid-cols-[220px_1fr_260px]">
            <div className="border-b lg:border-b-0 lg:border-r border-white/10 p-4 hidden sm:block">
              <div className="flex items-center gap-2 text-xs text-muted mb-4">
                <FolderClock className="w-3.5 h-3.5" /> Recent
              </div>
              {["auth.middleware.js", "sort_utils.py", "UserCard.tsx"].map((f) => (
                <div key={f} className="text-xs font-mono text-white/70 py-2 px-2 rounded-lg hover:bg-white/5 truncate">
                  {f}
                </div>
              ))}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted mb-3">
                <FileCode2 className="w-3.5 h-3.5" /> sort_utils.py
              </div>
              <pre className="font-mono text-[12px] leading-relaxed text-white/80 whitespace-pre-wrap">
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
            <div className="border-t lg:border-t-0 lg:border-l border-white/10 p-4">
              <div className="flex items-center gap-2 text-xs text-muted mb-3">
                <PanelRightOpen className="w-3.5 h-3.5" /> AI Insights
              </div>
              <div className="space-y-2 text-xs text-white/70">
                <p><span className="text-primary-light font-medium">Algorithm:</span> Divide-and-conquer sort</p>
                <p><span className="text-secondary-light font-medium">Complexity:</span> O(n log n) avg</p>
                <p><span className="text-accent-light font-medium">Security:</span> No issues found</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
