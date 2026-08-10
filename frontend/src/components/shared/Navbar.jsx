import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, Menu, X, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";



export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        background: scrolled ? "var(--nav-bg)" : "transparent",
        borderBottom: scrolled ? `1px solid var(--nav-border)` : "none",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        transition: "all 0.3s ease",
      }}
      className="fixed top-0 inset-x-0 z-50 py-4"
    >
      <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-violet-500/40 transition-shadow">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>
            AI Code Analyzer
          </span>
        </Link>



        <div className="hidden lg:flex items-center gap-3">
          {/* Dark / Light Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-secondary)",
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>

          {user ? (
            <>
              <button
                onClick={() => navigate("/workspace")}
                className="btn-secondary !py-2 !px-4 text-sm"
              >
                Open Workspace
              </button>
              <button
                onClick={logout}
                style={{ color: "var(--text-secondary)" }}
                className="text-sm hover:opacity-80 transition-opacity px-2"
              >
                Logout
              </button>
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/register" className="btn-primary !py-2 !px-5 text-sm">
                Start Analyzing
              </Link>
            </motion.div>
          )}
        </div>

        {/* Mobile row: toggle + hamburger */}
        <div className="lg:hidden flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-secondary)",
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
          <button
            style={{ color: "var(--text-primary)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          style={{
            background: "var(--nav-bg)",
            borderTop: "1px solid var(--nav-border)",
            backdropFilter: "blur(20px)",
          }}
          className="lg:hidden mt-3"
        >
          <div className="flex flex-col gap-4 px-6 py-6">

            <div style={{ background: "var(--border-clr)" }} className="h-px my-2" />
            {user ? (
              <button onClick={() => navigate("/workspace")} className="btn-primary text-sm">
                Open Workspace
              </button>
            ) : (
              <Link to="/register" className="btn-primary text-sm text-center">
                Start Analyzing
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
