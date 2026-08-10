import { motion } from "framer-motion";
import { ClipboardPaste, Cpu, ListChecks } from "lucide-react";

const steps = [
  { icon: ClipboardPaste, title: "Paste or upload your code", desc: "Drop in a file, paste a snippet, or connect an existing project." },
  { icon: Cpu, title: "Choose an analysis mode", desc: "Explain, find bugs, optimize, scan for security issues, or convert language." },
  { icon: ListChecks, title: "Read structured AI insights", desc: "Get a scored, line-by-line report you can save, bookmark, or export." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-5">
          <span className="section-eyebrow">Process</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl">From snippet to insight in three steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-primary/40 via-secondary/40 to-accent/40" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-6 relative z-10">
                <s.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
