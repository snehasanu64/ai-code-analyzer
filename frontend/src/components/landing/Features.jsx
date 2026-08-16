import { motion } from "framer-motion";
import { BookOpenText, Bug, Zap, ShieldCheck, FileText, Repeat, GraduationCap, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: BookOpenText,
    title: "1. Explain Code",
    desc: "Line-by-line breakdown tailored to beginner, developer, or expert levels with plain-language rules.",
    badge: "Auto-Detect",
    color: "from-purple-500 to-indigo-600",
  },
  {
    icon: Bug,
    title: "2. Audit Bugs",
    desc: "Static analysis flags logic flaws, edge-case unhandled exceptions, and shell execution risks with line numbers.",
    badge: "Severity Badges",
    color: "from-red-500 to-rose-600",
  },
  {
    icon: Zap,
    title: "3. Optimize Performance",
    desc: "Refactors inefficient loops and CLI commands into production-grade versions with 1-click 'Apply to Editor'.",
    badge: "1-Click Refactor",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: BarChart3,
    title: "4. Complexity Analysis",
    desc: "Calculates mathematical Big-O time and space bounds with input scaling growth tables from N=10 to N=1,000,000.",
    badge: "Big-O Curves",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: ShieldCheck,
    title: "5. Security Scanner",
    desc: "SAST scanning identifies RCE, eval(), OS command injection, hardcoded API secrets, SQLi, and XSS vulnerabilities.",
    badge: "SAST Security",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: FileText,
    title: "6. Documentation Generator",
    desc: "Generates clean function docstrings, CLI command guides, and README stubs with 1-click 'Apply to Editor'.",
    badge: "JSDoc / Readme",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Repeat,
    title: "7. Convert Language",
    desc: "Transpiles code between languages (Python, JS, TS, Java, C, C++, Go, SQL, PHP, JSX) with guaranteed transformations.",
    badge: "Multi-Transpiler",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: GraduationCap,
    title: "8. Learning Mode",
    desc: "360° Masterclass lessons with ELI10 analogies, step-by-step mechanics, technical interview Q&A, and exercises.",
    badge: "Masterclass Q&A",
    color: "from-indigo-500 to-blue-600",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-20 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-primary)",
            }}
          >
            Capabilities
          </span>
          <h2 className="mt-4 font-display font-extrabold text-3xl sm:text-4xl tracking-tight"
              style={{ color: "var(--text-primary)" }}>
            One workspace. Eight ways to analyze your code.
          </h2>
          <p className="mt-3 text-base font-normal" style={{ color: "var(--text-secondary)" }}>
            Every analysis runs in real time with high precision, giving you instant explanations, safety audits, and production optimizations.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-clr)",
                boxShadow: "var(--glass-shadow)",
              }}
              className="rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <span
                    style={{
                      background: "var(--glass-bg)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--text-secondary)",
                    }}
                    className="text-[10px] font-semibold rounded-full px-2.5 py-0.5"
                  >
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg mb-2 group-hover:text-purple-500 transition-colors"
                    style={{ color: "var(--text-primary)" }}>
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {f.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 flex items-center text-xs font-semibold text-purple-500 hover:text-purple-600"
                   style={{ borderTop: "1px solid var(--border-clr)" }}>
                <Link to="/register" className="inline-flex items-center gap-1">
                  <span>Try this mode</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
