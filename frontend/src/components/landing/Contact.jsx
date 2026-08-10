import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };
  return (
    <section id="contact" className="relative py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="gradient-border glass-card p-10 text-center"
        >
          <span className="section-eyebrow">Contact</span>
          <h2 className="mt-3 font-display font-bold text-3xl">Have a question for the team?</h2>
          <p className="mt-3 text-muted">We usually reply within one business day.</p>
          {sent ? (
            <p className="mt-8 text-accent font-medium">Thanks — your message has been sent.</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 grid sm:grid-cols-2 gap-4 text-left">
              <input required placeholder="Your name" className="input-field" />
              <input required type="email" placeholder="Your email" className="input-field" />
              <textarea required placeholder="Your message" rows={4} className="input-field sm:col-span-2" />
              <button type="submit" className="btn-primary sm:col-span-2 justify-center">
                Send message <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
