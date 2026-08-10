import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="light-shell flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md light-card p-8"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[0_4px_14px_rgba(124,58,237,0.25)]">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-gray-900">AI Code Analyzer</span>
        </Link>
        <h1 className="font-display font-bold text-2xl text-center text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 text-center mt-2">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>}
      </motion.div>
    </div>
  );
}
