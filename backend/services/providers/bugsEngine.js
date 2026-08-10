/**
 * Rich bug-detection engine. Each rule includes a fix example and a
 * "why it matters" note, mirroring the depth of explainEngine.js.
 */
const RULES = [
  {
    test: /==(?!=)/,
    langs: ["javascript", "typescript", "react", "node"],
    severity: "warning",
    title: "Loose equality operator",
    description: "Using `==` triggers implicit type coercion (e.g. `0 == \"\"` is true), which can hide bugs that only show up with unusual input.",
    suggestion: "Use `===` / `!==` for strict, predictable comparisons.",
    fixExample: "if (value === 0) { /* ... */ }",
  },
  {
    test: /\bvar\s+/,
    langs: ["javascript", "typescript", "react", "node"],
    severity: "info",
    title: "Legacy 'var' declaration",
    description: "`var` is function-scoped and hoisted, so it can leak out of blocks (`if`, `for`) in ways that surprise you later.",
    suggestion: "Prefer `let` for reassignable values and `const` for everything else.",
    fixExample: "const total = items.reduce((a, b) => a + b, 0);",
  },
  {
    test: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/,
    langs: null,
    severity: "critical",
    title: "Empty catch block",
    description: "Errors are being silently swallowed here — if this code fails, nobody will ever know, making the bug much harder to track down later.",
    suggestion: "At minimum, log the error. Ideally, handle it or re-throw with more context.",
    fixExample: "catch (err) { console.error('Failed to save:', err); throw err; }",
  },
  {
    test: /\beval\s*\(/,
    langs: null,
    severity: "critical",
    title: "Use of eval()",
    description: "`eval()` executes arbitrary strings as code. If any part of that string can be influenced by user input, this is a direct code-injection vulnerability.",
    suggestion: "Avoid eval() entirely — use JSON.parse for data, or a proper parser/interpreter for expressions.",
    fixExample: "const data = JSON.parse(jsonString);",
  },
  {
    test: /\.length\s*==\s*0|\.length\s*===\s*0/,
    langs: ["javascript", "typescript", "react", "node"],
    severity: "info",
    title: "Verbose empty-check",
    description: "Checking `.length === 0` works, but doesn't read as naturally as a truthiness check for arrays/strings.",
    suggestion: "`if (!arr.length)` is shorter and equally clear once the team is used to the idiom.",
    fixExample: "if (!items.length) return [];",
  },
  {
    test: /except\s*:\s*$/m,
    langs: ["python"],
    severity: "critical",
    title: "Bare except clause",
    description: "A bare `except:` catches every exception — including `KeyboardInterrupt` and `SystemExit` — which can hide real bugs and make the program hard to stop.",
    suggestion: "Catch specific exception types instead.",
    fixExample: "except ValueError as e:\n    logging.error(f\"Invalid value: {e}\")",
  },
  {
    test: /def\s+\w+\([^)]*=\s*\[\]/,
    langs: ["python"],
    severity: "warning",
    title: "Mutable default argument",
    description: "Default arguments in Python are evaluated once at function definition time, not per call — so a mutable default like `[]` is shared and mutated across every call.",
    suggestion: "Use `None` as the default and create the list inside the function body.",
    fixExample: "def add_item(item, items=None):\n    items = items or []\n    items.append(item)\n    return items",
  },
  {
    test: /SELECT .*\+|query\(`.*\$\{/i,
    langs: null,
    severity: "critical",
    title: "String-built SQL query",
    description: "Building SQL by concatenating strings or interpolating variables directly opens the door to SQL injection.",
    suggestion: "Use parameterized queries / prepared statements instead.",
    fixExample: "db.query('SELECT * FROM users WHERE id = ?', [userId]);",
  },
  {
    test: /console\.log\(/,
    langs: ["javascript", "typescript", "react", "node"],
    severity: "info",
    title: "Leftover console.log",
    description: "Debug logging left in the codebase clutters production logs and can leak internal data.",
    suggestion: "Remove it, or switch to a real logger with levels (debug/info/warn/error) that can be filtered in production.",
    fixExample: null,
  },
];

function detectBugsRich(code, language) {
  const codeLines = code.split("\n");
  const bugs = [];

  codeLines.forEach((line, idx) => {
    RULES.forEach((rule) => {
      if (rule.langs && !rule.langs.includes(language)) return;
      if (rule.test.test(line)) {
        bugs.push({
          line: idx + 1,
          severity: rule.severity,
          title: rule.title,
          description: rule.description,
          suggestion: rule.suggestion,
          fixExample: rule.fixExample,
        });
      }
    });
  });

  if (!bugs.length) {
    bugs.push({
      line: null,
      severity: "info",
      title: "No obvious issues detected",
      description: "Static heuristics did not flag common bug patterns in this snippet — that's a good sign, but it isn't a substitute for tests or a real code review.",
      suggestion: "Consider adding unit tests to lock in this behavior, especially around edge cases (empty input, null, very large input).",
      fixExample: null,
    });
  }

  const bySeverity = { critical: 0, warning: 0, info: 0 };
  bugs.forEach((b) => { bySeverity[b.severity] = (bySeverity[b.severity] || 0) + 1; });

  const summary = bySeverity.critical
    ? `Found ${bugs.length} issue(s), including ${bySeverity.critical} that should be fixed before this ships.`
    : bySeverity.warning
    ? `Found ${bugs.length} issue(s) — nothing blocking, but worth cleaning up.`
    : `Found ${bugs.length} minor/informational note(s). No blocking issues detected.`;

  return { bugs, totalIssues: bugs.length, summary, bySeverity };
}

module.exports = { detectBugsRich };
