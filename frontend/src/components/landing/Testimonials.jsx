import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Priya Nair", role: "Backend Engineer", quote: "The security scanner caught a hardcoded key in a PR before it ever reached staging." },
  { name: "Marcus Lee", role: "CS Student", quote: "Learning Mode's ELI10 explanations finally made recursion click for me." },
  { name: "Sofia Alvarez", role: "Tech Lead", quote: "Complexity analysis gives my team a common language for code review discussions." },
];

export default function Testimonials() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <span className="section-eyebrow">Testimonials</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl">Trusted by developers who ship</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-white/85 leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
