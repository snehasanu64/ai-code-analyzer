import { motion } from "framer-motion";
import { Pin, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    num: "01",
    pinColor: "text-amber-500",
    bgGradient: "bg-amber-500/10 border-amber-500/20",
    numColor: "text-amber-500",
    title: "Create Account & Verify OTP",
    desc: "Sign up in minutes with your username and email address. Enter your 6-digit email OTP to securely unlock the AI Code Analysis Workspace.",
    rotate: "-rotate-2 hover:rotate-0",
  },
  {
    num: "02",
    pinColor: "text-blue-500",
    bgGradient: "bg-blue-500/10 border-blue-500/20",
    numColor: "text-blue-500",
    title: "Select Mode & Paste Code",
    desc: "Paste any code snippet, SQL query, or Nginx config. Choose from 8 AI engines: Explain Code, Audit Bugs, Optimize, Security, Docs, Complexity, Convert, or Masterclass.",
    rotate: "rotate-2 hover:rotate-0",
  },
  {
    num: "03",
    pinColor: "text-purple-500",
    bgGradient: "bg-purple-500/10 border-purple-500/20",
    numColor: "text-purple-500",
    title: "Get AI Insights & Apply Code",
    desc: "Receive deep line-by-line walk-throughs, severity badges, mathematical Big-O scaling curves, and 1-click 'Apply to Editor' refactored code.",
    rotate: "-rotate-1 hover:rotate-0",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 px-6 overflow-hidden transition-colors duration-300">
      {/* Background connecting SVG curve line */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        <svg className="w-full h-full" viewBox="0 0 1200 400" fill="none" preserveAspectRatio="none">
          <path
            d="M 220 120 Q 500 240 600 160 T 980 280"
            stroke="var(--border-clr)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-primary)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Process</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            From snippet to insight in three steps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-base"
            style={{ color: "var(--text-secondary)" }}
          >
            Experience instant code intelligence with zero setup. Simple, secure, and production ready.
          </motion.p>
        </div>

        {/* 3 Floating Pinned Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-10 relative items-start">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-clr)",
                boxShadow: "var(--glass-shadow)",
              }}
              className={`relative rounded-3xl p-6 sm:p-8 transition-transform duration-300 ease-out ${s.rotate} group`}
            >
              {/* Push Pin Icon on Top Center */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                <div
                  className="p-1.5 rounded-full shadow-md"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-clr)",
                  }}
                >
                  <Pin className={`w-5 h-5 ${s.pinColor} fill-current transform rotate-45 group-hover:scale-110 transition-transform`} />
                </div>
              </div>

              {/* Number Container Card Inner */}
              <div className={`rounded-2xl p-5 mb-6 border ${s.bgGradient} transition-colors`}>
                <span className={`font-display font-black text-4xl sm:text-5xl ${s.numColor} tracking-tight block`}>
                  {s.num}
                </span>
              </div>

              {/* Content */}
              <h3 className="font-display font-bold text-xl mb-2.5 group-hover:text-purple-500 transition-colors"
                  style={{ color: "var(--text-primary)" }}>
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed font-normal" style={{ color: "var(--text-secondary)" }}>
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Button at Bottom */}
        <div className="mt-16 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Start Analyzing Code Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
