/**
 * Rich, markdown-formatted "explain code" engine for the mock AI provider.
 * Produces a tutor-style walkthrough: title, overview, line-by-line breakdown
 * with "why it matters" call-outs, a structural recap, beginner notes, and
 * a closing summary — mirroring what a real LLM-based explainer would return.
 */

const LANG_LABELS = {
  html: "HTML", css: "CSS", javascript: "JavaScript", typescript: "TypeScript",
  python: "Python", java: "Java", c: "C", cpp: "C++", php: "PHP", sql: "SQL",
  react: "React.js", reactjs: "React.js", node: "Node.js", nodejs: "Node.js", plaintext: "Code",
};

const langLabel = (lang) => LANG_LABELS[lang] || (lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : "Code");

const isMarkup = (lang) => lang === "html";
const isJsFamily = (lang) => ["javascript", "typescript", "react", "reactjs", "node", "nodejs"].includes(lang);

function guessSubject(code, language) {
  if (isMarkup(language)) {
    const m = code.match(/<title>\s*([^<]+?)\s*<\/title>/i);
    if (m) return m[1].trim();
  }
  const fn = code.match(/\bfunction\s+([a-zA-Z_$][\w$]*)/) || code.match(/\bdef\s+([a-zA-Z_][\w]*)/);
  if (fn) return `\`${fn[1]}\``;
  const cls = code.match(/\bclass\s+([a-zA-Z_$][\w$]*)/);
  if (cls) return `\`${cls[1]}\` class`;
  return "your code";
}

// ---------- HTML line-pattern rules ----------
const HTML_RULES = [
  {
    test: /<!DOCTYPE html>/i,
    explain: () => "This tells the browser that the document is written in **HTML5**, the modern version of HTML.",
    tips: ["Helps the browser render the page correctly", "Should always be at the top of an HTML file"],
  },
  {
    test: /<html[^>]*lang=["']([a-z-]+)["']/i,
    explain: (m) => `This is the **root element** of the whole HTML page. \`lang="${m[1]}"\` tells browsers and screen readers what language the page is written in.`,
    tips: ["Improves accessibility", "Helps search engines understand the page language"],
  },
  {
    test: /^\s*<head>\s*$/i,
    explain: () => "The `<head>` section holds **information about the page** — not visible content — like the title, meta tags, fonts, and stylesheet links.",
    tips: [],
  },
  {
    test: /<meta charset=["']([^"']+)["']/i,
    explain: (m) => `This sets the character encoding to **${m[1]}**, so the browser knows how to interpret text and symbols.`,
    tips: ["Supports most characters and symbols", "Prevents text from displaying incorrectly"],
  },
  {
    test: /<meta name=["']viewport["']/i,
    explain: () => "The viewport meta tag makes the page **responsive** on different devices — the width matches the device screen and starts at normal zoom.",
    tips: ["Without this, mobile layouts may look too zoomed out or broken"],
  },
  {
    test: /<title>\s*([^<]+?)\s*<\/title>/i,
    explain: (m) => `This sets the browser tab / bookmark title to **${m[1].trim()}**.`,
    tips: [],
  },
  {
    test: /<meta name=["']description["'][^>]*content=["']([^"']+)["']/i,
    explain: (m) => `This gives search engines a short summary of the page: _"${m[1]}"_.`,
    tips: ["Search engines may show this in search results", "Helps describe the site to users"],
  },
  {
    test: /<link rel=["']preconnect["'][^>]*fonts\.googleapis/i,
    explain: () => "This tells the browser to prepare an early connection to Google's font API server.",
    tips: ["Can help fonts load faster", "Improves performance slightly"],
  },
  {
    test: /<link rel=["']preconnect["'][^>]*fonts\.gstatic/i,
    explain: () => "This preconnects to Google's font *file* server. `crossorigin` is required because font files load from another domain.",
    tips: ["Helps external font files load more efficiently"],
  },
  {
    test: /fonts\.googleapis\.com\/css2\?family=/i,
    explain: () => "This imports one or more custom Google Fonts, with `display=swap` telling the browser to show a fallback font first and swap in the real one once it loads.",
    tips: ["Makes the site look more polished and on-brand", "Avoids invisible text while fonts load"],
  },
  {
    test: /<link rel=["']stylesheet["'][^>]*href=["'](?!https?:)([^"']+)["']/i,
    explain: (m) => `This connects the page to an external stylesheet (\`${m[1]}\`), where the visual design — colors, spacing, layout — actually lives.`,
    tips: ["Keeps styling separate from structure", "Makes the code easier to maintain"],
  },
  { test: /^\s*<\/head>\s*$/i, explain: () => "This closes the `<head>` section — everything after this is visible page content.", tips: [] },
  { test: /^\s*<body[^>]*>\s*$/i, explain: () => "The `<body>` contains everything that actually appears on the page: text, images, navigation, sections.", tips: [] },
  {
    test: /<div[^>]*class=["']([^"']*progress[^"']*)["'][^>]*id=["']([^"']*)["']/i,
    explain: (m) => `This creates an empty container (\`class="${m[1]}"\`, \`id="${m[2]}"\`) that CSS/JS will likely style and update as a **scroll progress indicator**.`,
    tips: ["Empty now, but can appear visually once CSS gives it height, width, and color"],
  },
  {
    test: /<!--(.*)-->/,
    explain: (m) => `This is a developer comment${m[1].trim() ? ` marking: **${m[1].trim()}**` : ""}. Comments never render on the page.`,
    tips: ["Organizes the code", "Makes large files easier to navigate"],
  },
  {
    test: /<header[^>]*class=["']([^"']*)["'][^>]*id=["']([^"']*)["']/i,
    explain: (m) => `This creates a semantic \`<header>\` (\`class="${m[1]}"\`, \`id="${m[2]}"\`) — the top navigation section of the page.`,
    tips: ["Semantic elements improve accessibility, SEO, and code readability"],
  },
  {
    test: /<div[^>]*class=["']([^"']*nav[^"']*)["']/i,
    explain: (m) => `An inner wrapper (\`class="${m[1]}"\`) used to control width, spacing, and alignment of the navbar's contents.`,
    tips: [],
  },
  {
    test: /<a[^>]*href=["']#([\w-]+)["'][^>]*class=["']([^"']+)["']/i,
    explain: (m) => `A clickable link — clicking it jumps to the section with \`id="${m[1]}"\`. \`class="${m[2]}"\` is used to style it (often the logo).`,
    tips: [],
  },
  {
    test: /<svg[^>]*viewBox=["']([^"']+)["']/i,
    explain: (m) => `Starts an inline **SVG** graphic (\`viewBox="${m[1]}"\` defines its drawing area) — a scalable vector image, ideal for logos and icons.`,
    tips: ["Stays sharp at any size", "Easy to recolor and style with CSS"],
  },
  {
    test: /<path[^>]*stroke=["']currentColor["']/i,
    explain: () => "Draws the main shape of the graphic. `stroke=\"currentColor\"` means the outline automatically matches the surrounding text color.",
    tips: ["Makes the icon easy to theme without editing the SVG itself"],
  },
  {
    test: /<circle[^>]*cx=["']([^"']+)["'][^>]*cy=["']([^"']+)["'][^>]*r=["']([^"']+)["']/i,
    explain: (m) => `Draws a circle centered at (${m[1]}, ${m[2]}) with radius ${m[3]} — likely a refined detail inside the logo.`,
    tips: [],
  },
  { test: /^\s*<\/svg>\s*$/i, explain: () => "Closes the SVG graphic.", tips: [] },
  {
    test: /<span>(.*)<\/span>/i,
    explain: (m) => `The visible logo text: **${m[1].replace(/<[^>]+>/g, "")}**. Any \`<em>\` inside is often used for subtle styling rather than true emphasis.`,
    tips: [],
  },
  { test: /^\s*<\/a>\s*$/i, explain: () => "Closes the link — both the icon and text before it are part of one clickable area.", tips: [] },
];

// ---------- Generic code-pattern rules (JS / Python / Java / C-family) ----------
// ---------- Nginx / Web Server & Database rules ----------
  {
    test: /^\s*server\s*\{/i,
    explain: () => "Defines a **Server Block** in Nginx (virtual host) that configures web server routing for a domain or IP address.",
    tips: ["Encloses all server-level routing, listening ports, and proxy rules"],
  },
  {
    test: /^\s*listen\s+(\d+);?/i,
    explain: (m) => `Instructs Nginx to listen for incoming HTTP web traffic on **Port ${m[1]}** (Port 80 is standard web traffic).`,
    tips: ["Required for Nginx to accept public web socket requests on this port"],
  },
  {
    test: /^\s*root\s+([^;]+);?/i,
    explain: (m) => `Sets the **document root directory** to \`${m[1].trim()}\`. Static frontend assets (index.html, JS, CSS) will be served from this server path.`,
    tips: ["Nginx directly serves pre-built production files from this directory"],
  },
  {
    test: /^\s*index\s+([^;]+);?/i,
    explain: (m) => `Configures **${m[1].trim()}** as the default file to load when a user visits the root web URL.`,
    tips: [],
  },
  {
    test: /^\s*location\s+([^\s{]+)\s*\{?/i,
    explain: (m) => `Defines a **Location Routing Block** matching URI paths starting with \`${m[1]}\`.`,
    tips: ["Used to split routes between static web pages and backend API endpoints"],
  },
  {
    test: /^\s*try_files\s+([^;]+);?/i,
    explain: (m) => `Configures **Single Page Application (SPA) Routing**: Nginx checks if requested file (\`$uri\`) exists; if not, falls back to \`/index.html\` so client-side React Router handles navigation cleanly!`,
    tips: ["Prevents 404 errors when refreshing client-side React/Vue pages"],
  },
  {
    test: /^\s*proxy_pass\s+([^;]+);?/i,
    explain: (m) => `Acts as a **Reverse Proxy**: forwards all matching incoming client requests to your backend Express server running at \`${m[1].trim()}\`.`,
    tips: ["Shields backend Node.js server from direct public exposure and handles load balancing"],
  },
  {
    test: /^\s*proxy_http_version\s+([^;]+);?/i,
    explain: (m) => `Forces Nginx to use **HTTP/${m[1].trim()}** for persistent backend proxy connections.`,
    tips: ["Optimizes connection keep-alives between Nginx and Express"],
  },
  {
    test: /^\s*proxy_set_header\s+Host\s+([^;]+);?/i,
    explain: (m) => `Relays original **Host** header (\`${m[1].trim()}\`) from the browser down to Express so the backend knows the actual domain requested.`,
    tips: ["Essential for domain routing and CORS headers"],
  },
  {
    test: /^\s*proxy_set_header\s+X-Real-IP\s+([^;]+);?/i,
    explain: (m) => `Passes client's real IP address (\`${m[1].trim()}\`) to backend instead of Nginx internal IP (127.0.0.1).`,
    tips: ["Critical for rate-limiting, security logging, and user IP tracking"],
  },
  {
    test: /^\s*proxy_set_header\s+([^;]+);?/i,
    explain: (m) => `Sets proxy header \`${m[1].trim()}\` to forward client metadata to the backend API.`,
    tips: [],
  },

  // ---------- Generic code-pattern rules (JS / Python / Java / C-family) ----------
  {
    test: /^\s*(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*new\s+Set\([^)]*\);?\s*$/,
    explain: (m) => `Instantiates a new Hash Set \`${m[1]}\`. A Set stores unique values and provides $O(1)$ constant-time lookup (\`.has()\`) and insertion (\`.add()\`).`,
    tips: [
      "Using a Set instead of an Array for lookup prevents $O(n)$ linear scans on every iteration",
      "Memory footprint scales with unique items $O(u)$"
    ],
  },
  {
    test: /^\s*(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*\[\];?\s*$/,
    explain: (m) => `Initializes an empty array \`${m[1]}\` to collect and store results as elements are processed.`,
    tips: ["Initializes empty storage in $O(1)$ time"],
  },
  {
    test: /\?\s*([^:]+)\s*:\s*(.+);?\s*$/,
    explain: (m) => `Uses a **ternary conditional expression**: checks the condition before the \`?\`. If true, executes the first branch; otherwise executes the second branch.`,
    tips: [
      "Provides concise conditional logic in a single line",
      "Executes in $O(1)$ time"
    ],
  },
  {
    test: /^\s*(?:for|while)\s*\(\s*const\s+([a-zA-Z_$][\w$]*)\s+of\s+([a-zA-Z_$][\w$]*)\s*\)/,
    explain: (m) => `Starts an ES6 \`for...of\` loop iterating sequentially over every item \`${m[1]}\` in the collection \`${m[2]}\`.`,
    tips: [
      "Provides readable, clean iteration over iterable data structures",
      "Does not mutate the original input array"
    ],
  },
  {
    test: /^\s*(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/,
    explain: (m) => `Defines an executable function \`${m[1]}\`${m[2].trim() ? ` accepting parameter(s): \`${m[2].trim()}\`` : " with no parameters"}.`,
    tips: [
      "Encapsulates logic into a reusable block",
      "Scope is created for local variables inside"
    ],
  },
  {
    test: /^\s*def\s+([a-zA-Z_][\w]*)\s*\(([^)]*)\)\s*:/,
    explain: (m) => `Defines a function named \`${m[1]}\`${m[2].trim() ? ` accepting arguments: \`${m[2].trim()}\`` : ""}.`,
    tips: ["Encapsulates reusable logic in Python"],
  },
  {
    test: /^\s*class\s+([a-zA-Z_$][\w$]*)/,
    explain: (m) => `Defines a class \`${m[1]}\` — an Object-Oriented blueprint containing data properties and methods.`,
    tips: ["Promotes code reusability and encapsulation"],
  },
  {
    test: /^\s*(?:if|elif)\s*\(?(.+?)\)?\s*:?\s*\{?\s*$/,
    explain: (m) => `Evaluates the conditional expression \`${m[1].replace(/[{}:]/g, "").trim()}\`. The enclosed block executes only if this evaluates to truthy.`,
    tips: ["Controls program execution flow based on runtime state"],
  },
  {
    test: /^\s*(?:else)\b/,
    explain: () => "Fallback branch: executes only when all preceding \`if\` or \`else if\` conditions evaluate to falsy.",
    tips: [],
  },
  {
    test: /^\s*return\s+(.+?);?\s*$/,
    explain: (m) => `Terminates function execution and passes the computed result \`${m[1].trim()}\` back to the caller.`,
    tips: ["Pops the current execution stack frame"],
  },
  {
    test: /^\s*return\s*$/,
    explain: () => "Exits the function immediately without returning a value.",
    tips: [],
  },
  {
    test: /^\s*(?:for|while)\s*\(?(.+?)\)?\s*:?\s*\{?\s*$/,
    explain: (m) => `Initiates a control loop conditioned on \`${m[1].replace(/[{}:]/g, "").trim()}\`, executing repeated iterations while true.`,
    tips: [],
  },
  {
    test: /^\s*(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(.+?);?\s*$/,
    explain: (m) => `Declares variable \`${m[1]}\` and initializes it with the evaluated value \`${m[2].trim()}\`.`,
    tips: [],
  },
  {
    test: /^\s*([a-zA-Z_][\w]*)\s*=\s*(.+?)\s*$/,
    explain: (m) => `Assigns the value \`${m[2].trim()}\` to variable \`${m[1]}\`.`,
    tips: [],
  },
  {
    test: /\.(append|push)\(([^)]*)\)/,
    explain: (m) => `Appends \`${m[2].trim() || "element"}\` onto the tail of the array in $O(1)$ amortized time.`,
    tips: ["Mutates the array length in-place"],
  },
  {
    test: /^\s*(?:import|from|require)\b/,
    explain: () => "Imports external modules or library dependencies required for execution.",
    tips: [],
  },
  {
    test: /^\s*(?:\/\/|#)\s*(.+)$/,
    explain: (m) => `Inline developer comment: _${m[1].trim()}_. Ignored by the runtime compiler/interpreter.`,
    tips: [],
  },
];

function matchRule(line, rules) {
  for (const rule of rules) {
    const m = line.match(rule.test);
    if (m) return { explanation: rule.explain(m), tips: rule.tips || [] };
  }
  return null;
}

function genericFallback(line, language) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed === "}" || trimmed === "};") return "Closes the code block.";
  if (isMarkup(language)) {
    if (/^<\/?[a-zA-Z]/.test(trimmed)) return `Markup structural container element: \`${trimmed.slice(0, 40)}\`.`;
    return "Text content rendered directly on the page.";
  }
  if (language && language.toLowerCase().includes("nginx")) {
    return `Configures Nginx web server directive: \`${trimmed.slice(0, 60)}\`.`;
  }
  return `Executes program statement: \`${trimmed.slice(0, 60)}\`.`;
}

const LEVEL_INTRO = {
  beginner: (lang) => `Here's a friendly, **beginner-level** explanation of your ${lang} snippet, line by line, followed by a quick overall summary.`,
  intermediate: (lang) => `Here's a structured, **developer-level** walkthrough of your ${lang} snippet — the mechanics line by line, then the bigger picture.`,
  expert: (lang) => `A terse, **expert-level** annotation of your ${lang} snippet, assuming familiarity with core language and platform concepts.`,
};

function buildOverview(code, language) {
  const bullets = [];
  const isNginx = /server\s*\{|listen\s+\d+|proxy_pass/i.test(code) || (language && language.toLowerCase().includes("nginx"));
  if (isNginx) {
    bullets.push("an Nginx HTTP virtual server listening on port 80");
    bullets.push("static frontend document root directory serving static HTML/JS/CSS");
    bullets.push("Single Page Application (SPA) try_files fallback routing");
    bullets.push("a reverse proxy forwarding /api requests to an Express Node.js backend running on port 5000");
    bullets.push("proxy headers preserving client Host and Real-IP addresses");
  } else if (isMarkup(language)) {
    if (/<!DOCTYPE html>/i.test(code)) bullets.push("the document type");
    if (/<html[^>]*lang=/i.test(code)) bullets.push("page language");
    if (/<title>/i.test(code) || /<meta name=["']description["']/i.test(code)) bullets.push("page title and description");
    if (/fonts\.googleapis|fonts\.gstatic/i.test(code)) bullets.push("font loading");
    if (/<link rel=["']stylesheet["']/i.test(code)) bullets.push("external CSS styling");
    if (/scroll-progress|scrollProgress/i.test(code)) bullets.push("a scroll progress bar");
    if (/<header|<nav/i.test(code)) bullets.push("the beginning of a navigation bar with a logo");
    if (/<svg/i.test(code)) bullets.push("an inline SVG graphic");
  } else {
    if (/\bfunction\b|\bdef\b/.test(code)) bullets.push("one or more function definitions");
    if (/\bif\b|\belif\b/.test(code)) bullets.push("conditional branching for edge cases");
    if (/\bfor\b|\bwhile\b/.test(code)) bullets.push("a loop that builds up a result iteratively");
    if (/return/.test(code)) bullets.push("a return value sent back to the caller");
    if (/class\s+[A-Z]/.test(code)) bullets.push("a class definition");
    if (/\[\]|\{\}/.test(code)) bullets.push("list/array or object data structures");
  }
  if (!bullets.length) bullets.push("a self-contained block of program logic");
  return bullets;
}

function buildBeginnerNotes(code, language) {
  const isNginx = /server\s*\{|listen\s+\d+|proxy_pass/i.test(code) || (language && language.toLowerCase().includes("nginx"));
  if (isNginx) {
    return [
      "**Reverse Proxying**: Nginx receives public internet requests on port 80 and safely forwards API requests to Node.js on port 5000.",
      "**SPA Routing (`try_files`)**: Essential for React/Vue apps so refreshing routes like `/workspace` loads `index.html` instead of throwing 404 errors.",
      "**Preserving Client IPs (`X-Real-IP`)**: Lets your Express backend log real client IP addresses for security & rate limiting."
    ];
  }
  if (isMarkup(language)) {
    const notes = [];
    if (/<header|<nav|<main|<footer|<section|<article/i.test(code)) {
      notes.push("**Semantic elements** like `<header>` are used instead of plain `<div>`s — this gives the markup meaning, which helps accessibility, SEO, and readability.");
    }
    if (/class=/.test(code) && /id=/.test(code)) {
      notes.push("Both **`class`** (for reusable styling across multiple elements) and **`id`** (for uniquely identifying one element, e.g. from JavaScript or an anchor link) are used here.");
    }
    if (/fonts\.googleapis|<link rel=["']stylesheet["']/i.test(code)) {
      notes.push("This file depends on external resources (fonts and/or a stylesheet) — the final appearance depends heavily on those.");
    }
    return notes;
  }
  const notes = [];
  if (/\bif\b.*\breturn\b/s.test(code)) notes.push("Early `return`s for edge cases (like empty or invalid input) keep the main logic below them simpler to read.");
  if (/\bfor\b|\bwhile\b/.test(code)) notes.push("Building up a result inside a loop is a common, memory-efficient alternative to recursion for this kind of problem.");
  return notes;
}

function detectLanguageMismatch(code, selectedLang) {
  const c = code.trim();
  const selected = (selectedLang || "").toLowerCase();

  const isNginx = /server\s*\{|listen\s+\d+|proxy_pass\s+http|try_files\s+\$uri|location\s+[\/\w]/i.test(c);
  const isSql = /\b(SELECT|INSERT INTO|CREATE TABLE|ALTER TABLE|UPDATE\s+\w+\s+SET|DELETE FROM|JOIN\s+\w+\s+ON)\b/i.test(c);
  const hasMarkupTags = /<(html|div|head|body|p|span|header|footer|script|style|title)\b/i.test(c) || /<!DOCTYPE html>/i.test(c);
  const hasJsConstructs = /\b(function|const|let|var|console\.log|=>|import\s+.*from|require\(|new\s+Set)\b/.test(c);
  const hasPyConstructs = /\b(def\s+\w+|elif\b|self\.|print\(|import\s+\w+|from\s+\w+\s+import)\b/.test(c);

  if (isNginx) {
    return selected === "nginx" ? null : "Nginx Server Configuration";
  }
  if (isSql) {
    return selected === "sql" ? null : "SQL Database Query";
  }
  if (selected === "html" && hasJsConstructs && !hasMarkupTags) {
    return "JavaScript";
  }
  if (selected === "html" && hasPyConstructs && !hasMarkupTags) {
    return "Python";
  }
  if (["javascript", "typescript", "node", "react"].includes(selected) && hasMarkupTags && !hasJsConstructs) {
    return "HTML";
  }
  return null;
}

function explainCodeMarkdown({ code, language, level = "beginner" }) {
  const detectedOther = detectLanguageMismatch(code, language);
  const effectiveLang = detectedOther ? detectedOther.toLowerCase() : language;
  const lang = effectiveLang;
  const label = langLabel(lang);
  const subject = guessSubject(code, lang);
  const rules = isMarkup(lang) ? HTML_RULES : CODE_RULES;
  const allLines = code.split("\n");
  const MAX_LINES = 40;
  const lines = allLines.slice(0, MAX_LINES);
  const truncated = allLines.length > MAX_LINES;

  const md = [];

  if (detectedOther) {
    md.push(`> ⚠️ **Language Mismatch Warning:** The selected language is **${langLabel(language)}**, but this code appears to be **${detectedOther}**. It has been analyzed as **${detectedOther}** for accuracy!`);
    md.push("");
  }

  md.push(`# ✨ ${label} code breakdown — *${subject}*`);
  md.push("");
  md.push(LEVEL_INTRO[level] ? LEVEL_INTRO[level](label) : LEVEL_INTRO.beginner(label));
  md.push("");

  if (level === "beginner") {
    md.push(`## 🎓 Beginner Concept Primer`);
    md.push("");
    md.push(`Before looking at line numbers, here is the core idea in plain language:`);
    md.push(`Think of this code like a **smart sorting system**. It takes input data, checks each item one by one against a memory list, and filters out duplicates so you end up with clean, organized results.`);
    md.push("");
  }

  md.push(`## 🌸 What this code is doing`);
  md.push("");
  md.push(`This ${label} snippet sets up:`);
  md.push("");
  buildOverview(code, lang).forEach((b) => md.push(`- ${b}`));
  md.push("");
  md.push(`## 🔍 Line-by-line breakdown`);
  md.push("");

  let n = 0;
  for (const rawLine of lines) {
    const line = rawLine;
    if (!line.trim()) continue;
    n += 1;
    const matched = matchRule(line, rules);
    const explanation = matched ? matched.explanation : genericFallback(line, lang);
    if (!explanation) continue;
    md.push("```" + (["reactjs", "nodejs", "react", "node"].includes(lang) ? "javascript" : lang) + "");
    md.push(line.trim());
    md.push("```");
    md.push(`**${n}.** ${explanation}`);
    if (matched && matched.tips.length && level !== "expert") {
      md.push("");
      md.push("✅ **Why it matters:**");
      matched.tips.forEach((t) => md.push(`- ${t}`));
    }
    md.push("");
  }
  if (truncated) {
    md.push(`_(showing the first ${MAX_LINES} lines — the rest follows the same pattern)_`);
    md.push("");
  }

  md.push(`## 🧾 Overall structure so far`);
  md.push("");
  md.push("This code currently builds:");
  md.push("");
  buildOverview(code, lang).forEach((b) => md.push(`- ${b}`));
  md.push("");

  const beginnerNotes = buildBeginnerNotes(code, lang);
  if (beginnerNotes.length && level !== "expert") {
    md.push(`## 💡 ${level === "beginner" ? "Key Takeaways for Beginners" : "Developer Notes"}`);
    md.push("");
    beginnerNotes.forEach((b) => md.push(`- ${b}`));
    md.push("");
  }

  md.push(`## ✨ Summary`);
  md.push("");
  md.push(
    isMarkup(lang)
      ? `This snippet is the foundation of **${subject}** — it prepares the page for proper rendering, responsiveness, SEO-friendly metadata, and a polished navigation bar. In simple terms: **this is the setup and top section of the page.**`
      : `This is a self-contained piece of ${label} logic centered around **${subject}**. In simple terms: **it takes an input, processes it step by step, and returns a result.**`
  );
  md.push("");

  return md.join("\n");
}

module.exports = { explainCodeMarkdown, langLabel, isMarkup, isJsFamily };
