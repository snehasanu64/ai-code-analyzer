/**
 * Shared markdown report builder for the mock AI provider. Turns the
 * structured heuristic data each analysis mode already computes (bug lists,
 * findings, suggestions, etc.) into a friendly, tutor-style narrative —
 * the same voice as explainEngine.js — instead of leaving the frontend to
 * render raw arrays with no framing or summary.
 */

const SEVERITY_EMOJI = { critical: "🔴", high: "🟠", warning: "🟡", medium: "🟠", info: "🔵", low: "🟢" };

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

function optimizeReport({ language, suggestions, code, timeComplexity, spaceComplexity }) {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const langName = (language || "Code").charAt(0).toUpperCase() + (language || "code").slice(1);

  const timeComp = timeComplexity || (code && (code.includes("for") || code.includes("while")) ? "O(N) linear traversal." : "O(1) constant time.");
  const spaceComp = spaceComplexity || "O(1) auxiliary storage (constant memory space).";

  const defaultInsights = [
    {
      title: "Memory Allocation",
      desc: "Pre-allocate arrays/lists if list-grow bounds are dynamic. This minimizes garbage collection overhead."
    },
    {
      title: "Loop Unrolling / Cache Line Utilization",
      desc: "Leverage fast standard iteration methods instead of nested checks."
    },
    {
      title: "Clean Code Guidelines",
      desc: "Extract larger functions into smaller helper units (<15 lines) to improve legibility and modular unit-test coverage."
    }
  ];

  const items = (suggestions && suggestions.length)
    ? suggestions.map((s, i) => `${i + 1}. **${s.title}:**\n\n   - ${s.description}`)
    : defaultInsights.map((ins, i) => `${i + 1}. **${ins.title}:**\n\n   - ${ins.desc}`);

  return [
    `# ⚡ AI Performance & Complexity Review`,
    ``,
    `- **Analyzed Language:** \`${langName}\``,
    `- **Analysis Time:** \`${timestamp}\``,
    ``,
    `## 📊 Complexity Score (Big O)`,
    ``,
    `- **Estimated Time Complexity:** \`${timeComp}\``,
    `- **Estimated Space Complexity:** \`${spaceComp}\``,
    ``,
    `## 💡 Optimizations & Clean Code Insights`,
    ``,
    items.join("\n\n"),
  ].join("\n");
}

function complexityReport({ language, timeComplexity, spaceComplexity, explanation }) {
  return buildReport({
    title: `Complexity analysis — ${language}`,
    titleEmoji: "📊",
    intro: `Estimated the algorithmic complexity of this ${language} snippet from its control-flow structure.`,
    sections: [
      {
        title: "Results",
        emoji: "📐",
        body: `**Time complexity:** \`${timeComplexity}\`\n**Space complexity:** \`${spaceComplexity}\`\n\n${explanation}`,
      },
    ],
    summary: `In plain terms: as input size grows, runtime scales roughly like \`${timeComplexity}\`, and memory usage scales like \`${spaceComplexity}\`.`,
    followUp: "Want me to suggest a lower-complexity approach, or walk through why this estimate holds?",
  });
}

function securityReport({ language, findings, riskLevel }) {
  const body = findings.length
    ? findings
        .map((f) => `**${SEVERITY_EMOJI[f.severity] || "•"} ${f.type}** (${f.severity})\n${f.description}\n\n→ **Recommendation:** ${f.recommendation}`)
        .join("\n\n")
    : "No common vulnerability patterns (SQL injection, XSS, CSRF, hardcoded secrets, missing validation) were detected by static analysis.";

  return buildReport({
    title: `Security scan — ${language}`,
    titleEmoji: "🛡️",
    intro: `Scanned this ${language} snippet for common vulnerability patterns. This is a static pattern-match, not a full penetration test or SAST tool.`,
    sections: [{ title: `Risk level: ${riskLevel}`, emoji: "🚨", body }],
    summary:
      riskLevel === "critical"
        ? "At least one critical finding here — treat this as blocking until addressed."
        : riskLevel === "moderate"
        ? "Nothing critical, but the findings above are worth fixing before production."
        : "No significant issues surfaced by this pass.",
    followUp: "For anything critical, I'd also recommend a manual review or a dedicated SAST tool before shipping.",
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
