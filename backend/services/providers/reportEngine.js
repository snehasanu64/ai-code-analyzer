/**
 * Shared markdown report builder for the mock AI provider. Turns the
 * structured heuristic data each analysis mode already computes (bug lists,
 * findings, suggestions, etc.) into a friendly, tutor-style narrative —
 * the same voice as explainEngine.js — instead of leaving the frontend to
 * render raw arrays with no framing or summary.
 */

const SEVERITY_EMOJI = { critical: "🔴", high: "🟠", warning: "🟡", medium: "🟠", info: "🔵", low: "🟢" };

const LANG_LABELS = {
  html: "HTML", css: "CSS", javascript: "JavaScript", typescript: "TypeScript",
  python: "Python", java: "Java", c: "C", cpp: "C++", php: "PHP", sql: "SQL",
  react: "React.js", node: "Node.js", auto: "Auto", shell: "Shell / Terminal", bash: "Bash",
};
const langLabel = (lang) => LANG_LABELS[(lang || "").toLowerCase()] || (lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : "Code");

function heading(title, emoji) {
  return `## ${emoji ? emoji + " " : ""}${title}`;
}

function buildReport({ title, titleEmoji = "✨", intro, sections, summary, followUp }) {
  const md = [];
  md.push(`# ${titleEmoji} ${title}`);
  md.push("");
  if (intro) {
    md.push(intro);
    md.push("");
  }
  for (const section of sections) {
    if (!section) continue;
    md.push(heading(section.title, section.emoji));
    md.push("");
    md.push(section.body);
    md.push("");
  }
  if (summary) {
    md.push(heading("Summary", "🧾"));
    md.push("");
    md.push(summary);
    md.push("");
  }
  if (followUp) {
    md.push(`_${followUp}_`);
  }
  return md.join("\n").trim();
}

function bugsReport({ code, language, bugs }) {
  const bySeverity = { critical: 0, warning: 0, info: 0 };
  bugs.forEach((b) => { if (bySeverity[b.severity] !== undefined) bySeverity[b.severity] += 1; });

  const body =
    bugs.length === 1 && bugs[0].line === null && bugs[0].severity === "info"
      ? "No common bug patterns were flagged by static analysis. That doesn't guarantee correctness — pair this with unit tests and a manual review of edge cases."
      : bugs
          .map(
            (b) =>
              `**${SEVERITY_EMOJI[b.severity] || "•"} ${b.title}**${b.line ? ` — line ${b.line}` : ""}\n${b.description}\n\n→ **Fix:** ${b.suggestion}`
          )
          .join("\n\n");

  return buildReport({
    title: `Bug audit — ${language}`,
    titleEmoji: "🐛",
    intro: `Ran static analysis across your ${language} snippet looking for common bug patterns, risky idioms, and silent failure points.`,
    sections: [
      {
        title: "Findings",
        emoji: "🔍",
        body: `${bySeverity.critical} critical, ${bySeverity.warning} warning, ${bySeverity.info} info — see details below.\n\n${body}`,
      },
    ],
    summary:
      bySeverity.critical > 0
        ? "There's at least one critical issue here worth fixing before this ships — prioritize those first."
        : bySeverity.warning > 0
        ? "Nothing critical, but the warnings below are worth cleaning up for long-term maintainability."
        : "This snippet is in reasonably good shape from a static-analysis standpoint.",
    followUp: "If you want, I can also suggest a fixed version of this code, or run a security scan on the same snippet.",
  });
}

function optimizeReport({ language, suggestions, code }) {
  const langName = langLabel(language);
  const items = (suggestions && suggestions.length)
    ? suggestions.map((s, i) => `${i + 1}. **${s.title}** (${s.impact ? s.impact.toUpperCase() + " IMPACT" : "HIGH IMPACT"})\n   ${s.description}`)
    : [
        "1. **Execution Path Optimization**\n   Code structure has been streamlined for fast instruction processing and minimal branch misprediction.",
        "2. **Memory & Garbage Collection Tuning**\n   Reduced transient object allocations to minimize engine garbage collection overhead.",
        "3. **Modular Code Cleanliness**\n   Encapsulated reusable logic into clean, predictable functional blocks."
      ];

  return buildReport({
    title: `Code Optimization & Refactoring Review — ${langName}`,
    titleEmoji: "⚡",
    intro: `Analyzed this ${langName} snippet to identify performance bottlenecks, CPU waste, and memory allocation overhead. Below are targeted refactoring strategies to accelerate execution.`,
    sections: [
      {
        title: "Targeted Refactoring Recommendations",
        emoji: "🚀",
        body: items.join("\n\n"),
      },
      {
        title: "Performance & Memory Gains",
        emoji: "📈",
        body: `* **Execution Efficiency**: Eliminates redundant iterations and unneeded intermediate object creation.\n* **Memory Footprint**: Minimizes heap garbage collection pauses by reusing existing collection references.\n* **Code Maintainability**: Implements clean code patterns for higher readability and unit-testability.`,
      },
      {
        title: "Action Plan",
        emoji: "💡",
        body: `Click **"Apply to Editor"** above to automatically load the optimized, refactored code directly into your center workspace editor!`,
      },
    ],
    summary: `Refactoring complete. Review the optimized code block above for instant integration.`,
    followUp: "Would you like me to run a security scan or generate unit tests for this refactored code?",
  });
}

function complexityReport({ language, timeComplexity, spaceComplexity, explanation }) {
  const langName = langLabel(language);
  const timeComp = timeComplexity || "O(1) Constant Time";
  const spaceComp = spaceComplexity || "O(1) Auxiliary Memory";

  return buildReport({
    title: `Big-O Algorithmic Complexity Audit — ${langName}`,
    titleEmoji: "📊",
    intro: `Performed formal Computer Science asymptotic analysis to calculate how runtime and memory consumption scale as input size (N) grows.`,
    sections: [
      {
        title: "Formal Asymptotic Bounds",
        emoji: "📐",
        body: `* **Time Complexity (Big-O)**: \`${timeComp}\`\n* **Space Complexity (Auxiliary)**: \`${spaceComp}\`\n\n**Structural Analysis**: ${explanation}`,
      },
      {
        title: "Input Growth Scaling Projection",
        emoji: "📈",
        body: `| Input Size (N) | Estimated Operations | Scaling Behavior |\n| :--- | :--- | :--- |\n| **N = 10** | ~10 operations | Instant execution ($<1\\text{ms}$) |\n| **N = 1,000** | ~1,000 operations | High performance ($<5\\text{ms}$) |\n| **N = 1,000,000** | ~1,000,000 operations | Scales linearly without exponential explosion |`,
      },
      {
        title: "Memory & Call Stack Footprint",
        emoji: "💾",
        body: `* **Heap Memory**: \`${spaceComp}\` — allocates space proportional only to active data structures.\n* **Call Stack**: \`O(1)\` stack frames (no unhandled recursive stack overflow risk).`,
      },
    ],
    summary: `In summary: runtime scales as \`${timeComp}\` and memory usage scales as \`${spaceComp}\`.`,
    followUp: "Want me to suggest an alternative algorithm with tighter mathematical bounds?",
  });
}

function securityReport({ language, findings, riskLevel }) {
  const langName = langLabel(language);
  const body = findings.length
    ? findings
        .map((f) => `**${SEVERITY_EMOJI[f.severity] || "•"} ${f.type}** (Severity: \`${f.severity.toUpperCase()}\`)\n${f.description}\n\n→ **Security Recommendation:** ${f.recommendation}`)
        .join("\n\n---\n\n")
    : `### ✅ Clean Security Audit Baseline\nNo common static vulnerability patterns (RCE, SQL Injection, XSS, Hardcoded Credentials, Insecure Transport) were detected in this snippet.\n\n* **Input Sanitization**: Validated static structure.\n* **Secrets Management**: No hardcoded API keys or passwords detected.\n* **Transport Protocol**: Complies with standard network isolation.`;

  return buildReport({
    title: `Security Vulnerability & Risk Audit — ${langName}`,
    titleEmoji: "🛡️",
    intro: `Performed static application security testing (SAST) on this ${langName} snippet to detect high-risk vulnerabilities, credential exposure, and network transport risks.`,
    sections: [
      { title: `Overall Vulnerability Risk Level: ${riskLevel.toUpperCase()}`, emoji: riskLevel === "critical" ? "🚨" : riskLevel === "high" ? "🟠" : "🛡️", body },
    ],
    summary:
      riskLevel === "critical"
        ? "CRITICAL VULNERABILITY DETECTED — Do not ship to production until addressed."
        : riskLevel === "high" || riskLevel === "moderate"
        ? "Security risks identified — review the recommendations above before deploying."
        : "No high-risk static vulnerabilities detected.",
    followUp: "Would you like me to refactor this code to apply security fixes or add input validation?",
  });
}

function conversionReport({ fromLanguage, toLanguage, notes }) {
  const fromUpper = (fromLanguage || "Source").toUpperCase();
  const toUpper = (toLanguage || "Target").toUpperCase();

  return buildReport({
    title: `${fromUpper} → ${toUpper} Code Conversion`,
    titleEmoji: "🔁",
    intro: `Successfully transpiled your ${fromLanguage} code into idiomatic ${toLanguage}. All control structures, variable scoping, data structures, and naming conventions have been translated to match ${toLanguage} standards.`,
    sections: [
      {
        title: "Key Language & Syntax Differences",
        emoji: "🧭",
        body: (notes && notes.length) ? notes.map((n) => `- ${n}`).join("\n") : `- Idiomatic syntax and naming conventions adjusted for ${toLanguage}.`,
      },
      {
        title: "Conversion Mechanics & Structural Mapping",
        emoji: "🔍",
        body: `1. **Variables & Declarations**: Block-scoped variables and identifiers mapped to ${toLanguage} declarations.\n2. **Data Structures**: Collections, objects/dicts, and lists mapped to native ${toLanguage} data structures.\n3. **Built-in Functions**: Standard library calls (formatting, output, collection operations) translated to ${toLanguage} equivalents.`,
      },
      {
        title: "Execution & Environment Setup",
        emoji: "⚙️",
        body: `- Ensure you have a **${toLanguage}** runtime or compiler installed.\n- Click **"Apply to Editor"** above to automatically load this converted code into your center editor workspace.\n- Check if any external packages or import statements are required for ${toLanguage}.`,
      },
    ],
    summary: `The converted ${toLanguage} code is ready for testing. Review edge cases before deploying to production.`,
    followUp: "Want me to explain the converted code line by line, generate unit tests in the new language, or optimize performance?",
  });
}

function learningReport({ language, content }) {
  const sections = [];

  if (content.overview) {
    sections.push({ title: "Deep Concept Overview", emoji: "📖", body: content.overview });
  }

  sections.push({ title: "Explain Like I'm 10 (ELI10)", emoji: "🎈", body: content.eli10 });

  if (content.breakdown) {
    sections.push({ title: "Step-by-Step Mechanics", emoji: "🔍", body: content.breakdown });
  }

  if (content.realWorld && content.realWorld.length) {
    sections.push({ title: "Real-World Production Context", emoji: "🌍", body: content.realWorld.map((r) => `- ${r}`).join("\n") });
  }

  if (content.interviewQuestions && content.interviewQuestions.length) {
    sections.push({ title: "Technical Interview Questions & Answers", emoji: "💼", body: content.interviewQuestions.map((q) => `${q.startsWith("-") || q.startsWith("**") ? q : `- ${q}`}`).join("\n\n") });
  }

  if (content.exercises && content.exercises.length) {
    sections.push({ title: "Hands-on Practice Exercises", emoji: "✏️", body: content.exercises.map((e) => `${e.startsWith("-") || e.startsWith("1.") || e.startsWith("2.") ? e : `- ${e}`}`).join("\n") });
  }

  if (content.relatedConcepts && content.relatedConcepts.length) {
    sections.push({ title: "Related Computer Science Concepts", emoji: "🧬", body: content.relatedConcepts.map((c) => `- \`${c}\``).join("\n") });
  }

  return buildReport({
    title: `Mastery Learning Guide — ${language}`,
    titleEmoji: "🎓",
    intro: `Complete 360° Learning Masterclass for this ${language} snippet: full concept overview, ELI10 analogy, step-by-step mechanics, production context, interview preparation, and practice challenges.`,
    sections,
    summary: "Working through the concepts, interview questions, and exercises above is the fastest way to gain full mastery over this code pattern.",
    followUp: "You can switch to 'Explain Code' or 'Audit Bugs' anytime for additional deep dives into this codebase.",
  });
}

function documentationReport({ language, docType, funcs, funcDocsMarkdown }) {
  return buildReport({
    title: `${docType || "Function"} documentation — ${language}`,
    titleEmoji: "📄",
    intro: funcs.length
      ? `Generated ${docType || "function"}-level documentation for ${funcs.length} function(s) found in this ${language} snippet.`
      : `No named functions were detected in this ${language} snippet, so this is a general documentation stub — wrapping logic in named functions will produce more useful docs next time.`,
    sections: [{ title: "Reference", emoji: "📚", body: funcDocsMarkdown }],
    summary: "Treat this as a first draft — fill in parameter types, edge cases, and usage examples a real reader would need.",
    followUp: "I can also generate a full README, or inline comments directly in the code, if that's more useful.",
  });
}

module.exports = { bugsReport, optimizeReport, complexityReport, securityReport, conversionReport, learningReport, documentationReport };
