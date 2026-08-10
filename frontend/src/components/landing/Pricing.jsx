import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "For trying AI Code Analyzer on personal projects.",
    features: ["50 analyses / month", "Core explanation & bug detection", "Community support"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    desc: "For individual developers who ship regularly.",
    features: ["Unlimited analyses", "All 8 AI modes", "PDF export & saved reports", "Priority queue"],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/ user / month",
    desc: "For teams that need shared history and admin controls.",
    features: ["Everything in Pro", "Shared projects & bookmarks", "Admin dashboard & usage analytics", "SSO (coming soon)"],
    cta: "Contact sales",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14 mx-auto text-center">
          <span className="section-eyebrow">Pricing</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl">Simple pricing that scales with you</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 flex flex-col ${
                p.highlight ? "gradient-border bg-white/[0.06] shadow-glow" : "glass-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="font-display font-semibold text-xl">{p.name}</h3>
              <p className="text-sm text-muted mt-1 mb-6">{p.desc}</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="font-display font-extrabold text-4xl">{p.price}</span>
                <span className="text-sm text-muted mb-1">{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={p.highlight ? "btn-primary w-full" : "btn-secondary w-full"}>
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
