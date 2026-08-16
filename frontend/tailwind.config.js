/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FF",
        surface: "#FFFFFF",
        "surface-light": "#EEF0F8",
        primary: {
          DEFAULT: "#7C3AED",
          light: "#9F67F5",
          dark: "#5B21B6",
        },
        secondary: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
        },
        accent: {
          DEFAULT: "#06B6D4",
          light: "#22D3EE",
        },
        muted: "#6B7280",
        border: "rgba(0,0,0,0.08)",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "grid-glow": "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.07), transparent 40%), radial-gradient(circle at 80% 0%, rgba(6,182,212,0.06), transparent 40%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.06), transparent 40%)",
        "gradient-primary": "linear-gradient(135deg, #7C3AED 0%, #3B82F6 50%, #06B6D4 100%)",
        "gradient-border": "linear-gradient(135deg, rgba(124,58,237,0.6), rgba(6,182,212,0.6))",
      },
      boxShadow: {
        glow: "0 0 40px rgba(124,58,237,0.35)",
        "glow-cyan": "0 0 40px rgba(6,182,212,0.3)",
        "glow-sm": "0 0 20px rgba(124,58,237,0.25)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "gradient-x": "gradientX 8s ease infinite",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
