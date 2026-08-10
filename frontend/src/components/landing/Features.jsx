import { motion } from "framer-motion";
import { BookOpenText, Bug, Zap, ShieldCheck, FileText, Repeat, GraduationCap, BarChart3 } from "lucide-react";

const features = [
  { icon: BookOpenText, title: "Code Explanation", desc: "Line-by-line breakdowns tuned to beginner, intermediate or expert depth." },
  { icon: Bug, title: "Bug Detection", desc: "Static heuristics surface logic errors, silent failures and risky patterns." },
  { icon: Zap, title: "Code Optimization", desc: "Actionable suggestions to reduce complexity and improve runtime performance." },
  { icon: BarChart3, title: "Complexity Analysis", desc: "Time and space complexity estimates with plain-language reasoning." },
  { icon: ShieldCheck, title: "Security Scanner", desc: "Flags SQL injection, XSS, CSRF, hardcoded secrets and missing validation." },
  { icon: FileText, title: "Documentation Generator", desc: "Function docs, class docs, API docs and README scaffolding in seconds." },
  { icon: Repeat, title: "Code Conversion", desc: "Translate between languages and frameworks while preserving intent." },
  { icon: GraduationCap, title: "Learning Mode", desc: "ELI10 explanations, interview questions, exercises and quizzes." },
];

export default function Features() {
  return (
    <section id="features" className="relative py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-6">
          <span className="section-eyebrow">Capabilities</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl">
            One workspace. Eight ways to understand your code.
          </h2>
          <p className="mt-4 text-muted">
            Every action runs against the same three-panel workspace, so context never gets lost between explanation, review, and fixes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass-card p-6 group hover:border-primary/40 border border-transparent transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 shadow-glow-sm group-hover:shadow-glow transition-shadow">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
