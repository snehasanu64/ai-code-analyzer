import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Which programming languages does AI Code Analyzer support?", a: "Python, JavaScript, TypeScript, Java, C, C++, PHP, HTML, CSS, SQL, React and Node.js/Express.js, with more added regularly." },
  { q: "Is my code stored or shared?", a: "Your code and analysis history are private to your account. Team plans allow you to explicitly share projects with teammates." },
  { q: "Can I plug in my own AI provider?", a: "Yes — the backend uses a modular AI service layer, so switching between the built-in mock engine, Gemini, OpenAI, or Claude is a configuration change, not a rewrite." },
  { q: "Does the security scanner replace a real audit?", a: "No. It's a fast first pass for common issues like SQL injection, XSS, CSRF and hardcoded secrets — always pair it with a full security review for production systems." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-14 text-center">
          <span className="section-eyebrow">FAQ</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl">Questions, answered</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-muted transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-muted leading-relaxed">{f.a}</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
