import { Link } from "react-router-dom";
import { Code2, Github, Twitter, Linkedin } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: ["Features", "Languages", "Pricing", "Changelog"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Learning Mode", "Blog"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact", "Privacy Policy"],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold">AI Code Analyzer</span>
          </div>
          <p className="text-sm text-muted max-w-xs">
            Understand, analyze, optimize and secure code with AI — built for developers who ship.
          </p>
          <div className="flex gap-3 mt-5">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Icon className="w-4 h-4 text-muted" />
              </a>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-display font-semibold text-sm mb-4">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <span>© {new Date().getFullYear()} AI Code Analyzer. All rights reserved.</span>
          <span>Built with React, Node.js &amp; MongoDB.</span>
        </div>
      </div>
    </footer>
  );
}
