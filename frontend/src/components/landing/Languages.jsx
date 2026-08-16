import { motion } from "framer-motion";

const languages = [
  { name: "JavaScript", color: "bg-yellow-400 text-yellow-950" },
  { name: "TypeScript", color: "bg-blue-600 text-white" },
  { name: "Python", color: "bg-emerald-600 text-white" },
  { name: "Java", color: "bg-amber-600 text-white" },
  { name: "C", color: "bg-slate-700 text-white" },
  { name: "C++", color: "bg-cyan-600 text-white" },
  { name: "PHP", color: "bg-indigo-600 text-white" },
  { name: "HTML5", color: "bg-orange-600 text-white" },
  { name: "CSS3", color: "bg-sky-600 text-white" },
  { name: "SQL Query", color: "bg-purple-600 text-white" },
  { name: "React.js", color: "bg-cyan-500 text-white" },
  { name: "Node.js", color: "bg-green-600 text-white" },
  { name: "Nginx Config", color: "bg-emerald-700 text-white" },
  { name: "Shell / CLI", color: "bg-gray-900 text-white" },
];

export default function Languages() {
  return (
    <section id="languages" className="relative py-16 px-6 transition-colors duration-300"
             style={{ borderTop: "1px solid var(--border-clr)", borderBottom: "1px solid var(--border-clr)" }}>
      <div className="max-w-7xl mx-auto text-center">
        <span
          className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-primary)",
          }}
        >
          Multi-Language Engine
        </span>
        <h2 className="mt-4 font-display font-extrabold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}>
          Bring the code you write every day
        </h2>
        <p className="mt-3 text-sm max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          Built with auto-detection for popular languages, backend frameworks, relational databases, and devops server configurations.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {languages.map((lang, i) => (
            <motion.span
              key={lang.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-clr)",
                color: "var(--text-primary)",
              }}
              className="rounded-2xl px-4 py-2 text-xs font-mono font-bold shadow-xs hover:border-purple-500 transition-all flex items-center gap-2 cursor-default"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${lang.color} inline-block`} />
              {lang.name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
