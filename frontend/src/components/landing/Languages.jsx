import { motion } from "framer-motion";

const languages = [
  "Python", "JavaScript", "TypeScript", "Java", "C", "C++", "PHP", "HTML", "CSS", "SQL", "React", "Node.js", "Express.js",
];

export default function Languages() {
  return (
    <section id="languages" className="relative py-8 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <span className="section-eyebrow">Supported languages</span>
        <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl">Bring the code you already write</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {languages.map((lang, i) => (
            <motion.span
              key={lang}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.03 }}
              className="rounded-full px-5 py-2.5 text-sm font-mono font-semibold bg-slate-900/80 border border-violet-500/40 text-violet-100 hover:border-violet-400 hover:bg-violet-600/30 hover:text-white transition-all shadow-lg hover:shadow-violet-500/20 cursor-default"
            >
              <span className="w-2 h-2 rounded-full bg-violet-400 inline-block mr-2" />
              {lang}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
