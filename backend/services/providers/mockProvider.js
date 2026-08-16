/**
 * Mock AI provider.
 * Produces deterministic, realistic-looking analysis payloads so the full
 * product can be built and demoed without any external API key.
 * Every other provider (gemini/openai/claude) must implement the exact
 * same method signatures so aiService.js can swap providers with zero
 * changes to controllers or the frontend.
 */

const { explainCodeMarkdown } = require("./explainEngine");
const {
  bugsReport, optimizeReport, complexityReport, securityReport, conversionReport, learningReport, documentationReport,
} = require("./reportEngine");

const hash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const scoreFromCode = (code, seedOffset = 0) => {
  const h = hash(code) + seedOffset;
  return 55 + (h % 41); // 55-95 range, deterministic per snippet
};

const lines = (code) => code.split("\n").filter((l) => l.trim().length > 0);

const detectConstructs = (code) => {
  return {
    hasLoop: /\b(for|while)\b/.test(code),
    hasCondition: /\bif\b/.test(code),
    hasFunction: /\b(function|def|=>)\b/.test(code),
    hasClass: /\bclass\b/.test(code),
    hasSQL: /\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(code),
    hasSecretLike: /(api[_-]?key|secret|password)\s*=\s*["'][^"']+["']/i.test(code),
    hasInnerHTML: /innerHTML|dangerouslySetInnerHTML/.test(code),
    hasEval: /\beval\(/.test(code),
  };
};

async function explainCode({ code, language, level }) {
  const markdown = explainCodeMarkdown({ code, language, level: level || "beginner" });
  return { markdown, algorithms: guessAlgorithm(code), dataStructures: guessDataStructures(code) };
}

function extractIdentifiers(code, regex) {
  const found = new Set();
  let m;
  const re = new RegExp(regex);
  while ((m = re.exec(code)) !== null) {
    if (m[1]) found.add(m[1]);
    if (found.size > 20) break;
  }
  return Array.from(found);
}

function guessAlgorithm(code) {
  const hits = [];
  if (/for.*for/s.test(code)) hits.push("Nested iteration — possible O(n²) pattern (e.g. bubble/selection sort or matrix traversal).");
  if (/mid\s*=|binary/i.test(code)) hits.push("Possible binary search / divide-and-conquer pattern.");
  if (/fetch\(|axios\./.test(code)) hits.push("Asynchronous network request pattern.");
  if (hits.length === 0) hits.push("No well-known named algorithm pattern strongly detected; treated as general-purpose logic.");
  return hits;
}

function guessDataStructures(code) {
  const hits = [];
  if (/\[\]|Array\(/.test(code)) hits.push("Array / List");
  if (/\{\}/.test(code) && /:/.test(code)) hits.push("Object / Map-like structure");
  if (/Set\(/.test(code)) hits.push("Set");
  if (/Map\(/.test(code)) hits.push("Map");
  return hits.length ? hits : ["Primitive values only — no composite data structure detected."];
}

function detectActualLanguage(code) {
  const c = code.trim();
  if (/^\s*(sudo|apt|curl|wget|npm|git|pm2|docker|systemctl|yarn|pip|npx|cd|mkdir)\b/im.test(c)) return "shell";
  if (/\bconst\b|\blet\b|\bvar\b|\bfunction\b|\basync\b|\bawait\b|\brequire\s*\(|\bmodule\.exports\b|\bimport\b.*from/.test(c)) return "javascript";
  if (/\bdef\s+\w+\s*\(|\bimport\s+\w+|\bprint\s*\(|\bclass\s+\w+\s*:/.test(c)) return "python";
  if (/#include\s*<|\bprintf\s*\(|\bint\s+main\s*\(/.test(c)) return "c";
  if (/\bpublic\s+class\b|\bSystem\.out\.print|\bvoid\s+main\b/.test(c)) return "java";
  if (/\b(SELECT\s+[\w*]+|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE)\b/i.test(c)) return "sql";
  return null;
}

async function findBugs({ code, language }) {
  const constructs = detectConstructs(code);
  const bugs = [];
  const codeLines = code.split("\n");

  const userLang   = (language || "").toLowerCase();
  const autoLang   = detectActualLanguage(code);
  const effectiveLang = autoLang || userLang;

  // Warn if the user has the wrong language selected (only if not 'auto')
  if (autoLang && userLang && userLang !== "auto" && autoLang !== userLang && !userLang.startsWith(autoLang) && !autoLang.startsWith(userLang)) {
    bugs.push({
      line: null,
      severity: "warning",
      title: `Language mismatch — code looks like ${autoLang.toUpperCase()} but '${userLang.toUpperCase()}' is selected`,
      description: `The static analysis ran ${userLang.toUpperCase()} rules but the code pattern matches ${autoLang.toUpperCase()}. Results may be incomplete.`,
      suggestion: `Change the Language selector to '${autoLang}' for accurate bug detection.`,
    });
  }

  const lang   = effectiveLang;
  const isJS   = lang === "javascript" || lang === "typescript" || lang === "js" || lang === "ts";
  const isPy   = lang === "python" || lang === "py";
  const isC    = lang === "c" || lang === "cpp" || lang === "c++";
  const isJava = lang === "java";
  const isSql  = lang === "sql";

  codeLines.forEach((line, idx) => {
    const ln = idx + 1;
    const t  = line.trim();

    /* ── Terminal / CLI / DevOps Commands ── */
    if (/git\s+push\s+.*--force\b|-f\b/i.test(line))
      bugs.push({ line: ln, severity: "critical", title: "Force push risk (git push --force)", description: "Force pushing overwrites remote commits on GitHub, potentially destroying team commit history.", suggestion: "Use --force-with-lease or rebase cleanly before pushing." });

    if (/chmod\s+777\b/i.test(line))
      bugs.push({ line: ln, severity: "critical", title: "Overly permissive file permissions (chmod 777)", description: "Granting read, write, and execute permissions to all world users allows unauthorized access.", suggestion: "Restrict permissions using chmod 755 for executables or 644 for files." });

    if (/curl\s+[^|\n]+\|\s*(sh|bash)/i.test(line) || /wget\s+[^|\n]+\|\s*(sh|bash)/i.test(line))
      bugs.push({ line: ln, severity: "critical", title: "Unsafe remote shell script execution (curl | bash)", description: "Piping unverified internet downloads directly into bash shell executes unvetted remote code.", suggestion: "Download the script first, inspect its contents, and execute explicitly." });

    if (/rm\s+-rf\s+(\/|\*|\.\/)/i.test(line))
      bugs.push({ line: ln, severity: "critical", title: "Destructive recursive file deletion (rm -rf)", description: "Unconstrained recursive deletion can permanently wipe critical server directories.", suggestion: "Specify exact folder paths and verify paths before execution." });

    /* ── JavaScript / TypeScript ── */
    if (isJS) {
      if (/[^=!<>]==(?!=)/.test(line) && !/==[>=]/.test(line))
        bugs.push({ line: ln, severity: "warning", title: "Loose equality (==)", description: "Type coercion with == can cause subtle bugs (e.g. 0 == false → true).", suggestion: "Replace == with === and != with !==." });

      if (/\bvar\s+/.test(line))
        bugs.push({ line: ln, severity: "info", title: "Legacy 'var' declaration", description: "'var' is function-scoped and hoisted, leading to confusing scoping bugs.", suggestion: "Use 'const' for values that don't change, 'let' otherwise." });

      if (/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/.test(line))
        bugs.push({ line: ln, severity: "critical", title: "Empty catch block — silent error swallow", description: "Errors are caught and discarded, hiding runtime failures from logs.", suggestion: "Log the error with console.error(err) or rethrow it." });

      if (/\.forEach\s*\(.*async/.test(line))
        bugs.push({ line: ln, severity: "critical", title: "async callback inside forEach", description: "forEach does not await async callbacks — errors and rejections are silently ignored.", suggestion: "Use 'for...of' with await, or Promise.all() with .map()." });

      if (/JSON\.parse\s*\(/.test(line) && !/try/.test(codeLines.slice(Math.max(0, idx - 3), idx).join("\n")))
        bugs.push({ line: ln, severity: "warning", title: "Unguarded JSON.parse()", description: "JSON.parse() throws a SyntaxError if input is malformed.", suggestion: "Wrap in try/catch to handle invalid JSON gracefully." });

      if (/\.innerHTML\s*=/.test(line))
        bugs.push({ line: ln, severity: "critical", title: "XSS risk — innerHTML assignment", description: "Assigning to innerHTML can execute injected scripts if the value comes from user input.", suggestion: "Use textContent or sanitize with DOMPurify before assignment." });

      if (/console\.(log|warn|error)\s*\(/.test(line))
        bugs.push({ line: ln, severity: "info", title: "console statement left in code", description: "Debug console calls should be removed before shipping to production.", suggestion: "Remove or replace with a structured logger (winston, pino)." });

      if (/process\.exit\s*\(/.test(line))
        bugs.push({ line: ln, severity: "warning", title: "process.exit() abruptly kills Node.js process", description: "process.exit() runs without cleanup hooks (finally blocks, drain events).", suggestion: "Throw an error and let the top-level handler exit, or set process.exitCode." });

      if (/delete\s+\w+\.\w+/.test(line))
        bugs.push({ line: ln, severity: "warning", title: "Property deletion with 'delete'", description: "Deleting properties breaks V8 hidden-class optimisations and hurts performance.", suggestion: "Set the property to undefined or null instead of deleting it." });

      if (/setTimeout\s*\(\s*[^,]+,\s*0\s*\)/.test(line))
        bugs.push({ line: ln, severity: "info", title: "setTimeout with 0ms delay — code smell", description: "setTimeout(fn, 0) defers to the next event-loop tick; usually a sign of poor async design.", suggestion: "Restructure the async flow or use Promise.resolve().then(fn)." });
    }

    /* ── Python ── */
    if (isPy) {
      if (/except\s*:/.test(line) || /except\s+Exception\s*:/.test(line))
        bugs.push({ line: ln, severity: "warning", title: "Bare except clause", description: "Catching all exceptions hides unexpected errors and makes debugging difficult.", suggestion: "Catch specific exception types, e.g. 'except ValueError as e:'." });

      if (/==\s*(None|True|False)|(None|True|False)\s*==/.test(line))
        bugs.push({ line: ln, severity: "warning", title: "Equality check against None/True/False with ==", description: "PEP 8 prohibits comparing to singletons with == or !=.", suggestion: "Use 'is' or 'is not': 'if x is None:'." });

      if (/def\s+\w+\s*\([^)]*=\s*\[/.test(line))
        bugs.push({ line: ln, severity: "critical", title: "Mutable default argument", description: "A list used as default argument is shared across all calls — mutations persist between calls.", suggestion: "Use None as default and initialise inside the function body." });

      if (/print\s*\(/.test(line))
        bugs.push({ line: ln, severity: "info", title: "print() debug statement", description: "Debug print statements should be removed or replaced with proper logging.", suggestion: "Use Python's 'logging' module instead of print()." });

      if (/open\s*\(/.test(line) && !/with\s+open/.test(line))
        bugs.push({ line: ln, severity: "critical", title: "File opened without context manager", description: "open() without 'with' can cause file descriptor leaks.", suggestion: "Use 'with open(file) as f:' to ensure the file is closed automatically." });
    }

    /* ── C / C++ ── */
    if (isC) {
      if (/\bgets\s*\(/.test(line))
        bugs.push({ line: ln, severity: "critical", title: "Use of gets() — buffer overflow risk", description: "gets() has no bounds checking and is a classic buffer overflow vulnerability.", suggestion: "Replace with fgets(buf, sizeof(buf), stdin)." });

      if (/\bstrcpy\s*\(/.test(line))
        bugs.push({ line: ln, severity: "critical", title: "Use of strcpy() — buffer overflow risk", description: "strcpy() copies without size checks and can overflow the destination buffer.", suggestion: "Use strncpy() or strlcpy() with an explicit size limit." });

      if (/\bmalloc\s*\(/.test(line) && !/free\s*\(/.test(code))
        bugs.push({ line: ln, severity: "warning", title: "malloc() without free() — memory leak", description: "Memory allocated with malloc() is never freed in this snippet.", suggestion: "Ensure every malloc() has a corresponding free() call." });

      if (/\bscanf\s*\(/.test(line) && !/%\d+[s]/.test(line))
        bugs.push({ line: ln, severity: "warning", title: "Unbounded scanf() string read", description: "Reading strings with %s in scanf() can overflow the buffer.", suggestion: "Add a width specifier, e.g. '%99s' for a 100-char buffer." });
    }

    /* ── Java ── */
    if (isJava) {
      if (/==\s*"/.test(line) || /"\s*==/.test(line))
        bugs.push({ line: ln, severity: "critical", title: "String comparison with == (reference equality)", description: "== compares object references, not string content.", suggestion: "Use str.equals(\"value\") or Objects.equals(a, b)." });

      if (/catch\s*\(\s*Exception\s+\w+\s*\)\s*\{\s*\}/.test(line))
        bugs.push({ line: ln, severity: "critical", title: "Empty catch block — silent failure", description: "Exception is caught and silently discarded.", suggestion: "Log the exception: logger.error(e.getMessage())." });

      if (/\.printStackTrace\(\)/.test(line))
        bugs.push({ line: ln, severity: "info", title: "printStackTrace() in production code", description: "Printing stack traces to stderr is not suitable for production logging.", suggestion: "Use a logging framework (Log4j, SLF4J) instead." });
    }

    /* ── SQL ── */
    if (isSql) {
      if (/SELECT\s+\*/i.test(line))
        bugs.push({ line: ln, severity: "warning", title: "SELECT * — fetches unnecessary columns", description: "Selecting all columns adds network overhead and breaks code when the schema changes.", suggestion: "List only the columns you need: SELECT id, name, email." });

      if (/DROP\s+TABLE/i.test(line))
        bugs.push({ line: ln, severity: "critical", title: "Destructive DROP TABLE statement", description: "DROP TABLE permanently deletes a table and all its data.", suggestion: "Add IF EXISTS, confirm intent, and run inside a transaction." });

      if (/DELETE\s+FROM\s+\w+\s*;/i.test(line) && !/WHERE/i.test(line))
        bugs.push({ line: ln, severity: "critical", title: "DELETE without WHERE clause — deletes ALL rows", description: "A DELETE without WHERE removes every record in the table.", suggestion: "Always add a WHERE clause to limit which rows are deleted." });
    }

    if (/TODO|FIXME|HACK|XXX/.test(line))
      bugs.push({ line: ln, severity: "info", title: `${(t.match(/TODO|FIXME|HACK|XXX/) || ["TODO"])[0]} comment — unresolved technical debt`, description: "Unresolved tech-debt marker found in source.", suggestion: "Track as a backlog item and address before the next release." });

    if (/password\s*=\s*["'][^"']+["']|secret\s*=\s*["'][^"']+["']|api_?key\s*=\s*["'][^"']+["']/i.test(line))
      bugs.push({ line: ln, severity: "critical", title: "Hardcoded credential / secret detected", description: "A password, API key, or secret is hardcoded in the source file.", suggestion: "Move secrets to environment variables or a secrets manager (.env, AWS Secrets Manager, Vault)." });

    /* ── Incomplete / truncated code detection ── */
    if (/\brequ(i|ir|ire)?\s*$/.test(t))
      bugs.push({ line: ln, severity: "critical", title: "Incomplete require() statement", description: "The 'require' keyword is cut off — the module import is incomplete.", suggestion: "Complete the statement: const moduleName = require('module-name');" });

    if (/\bawai(t)?\s*$/.test(t))
      bugs.push({ line: ln, severity: "critical", title: "Incomplete await expression", description: "The 'await' keyword has no expression after it — incomplete async call.", suggestion: "Complete the expression: const result = await someAsyncFunction();" });

    if (/async\s*\(\s*$/.test(t))
      bugs.push({ line: ln, severity: "critical", title: "Incomplete async function declaration", description: "The async function declaration is cut off — missing parameter list or arrow.", suggestion: "Complete the declaration: async () => { ... } or async function name() { ... }" });

    if (/module\.(exp(o(r(t(s?)?)?)?)?)?\s*$/.test(t))
      bugs.push({ line: ln, severity: "critical", title: "Incomplete module.exports statement", description: "The module.exports line is truncated and does not export anything.", suggestion: "Complete the export: module.exports = myFunction;" });

    if ((t.match(/`/g) || []).length % 2 !== 0)
      bugs.push({ line: ln, severity: "critical", title: "Unclosed template literal (backtick)", description: "A template literal string is opened but never closed on this line.", suggestion: "Close the template literal with a matching backtick (`), or move the closing backtick to the correct position." });
  });


  if (constructs.hasEval)
    bugs.push({ line: null, severity: "critical", title: "Use of eval()", description: "eval() executes arbitrary code strings — a major security and reliability risk.", suggestion: "Avoid eval(). Use JSON.parse() or explicit parsing logic instead." });

  /* Dedup by title + line */
  const seen = new Set();
  const deduped = bugs.filter((b) => {
    const key = `${b.title}:${b.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length === 0) {
    deduped.push({
      line: null,
      severity: "info",
      title: "No common bug patterns detected",
      description: "Static heuristic analysis did not flag any known patterns in this snippet.",
      suggestion: "Add unit tests and a linter (ESLint / pylint / checkstyle) for deeper coverage.",
    });
  }

  return { bugs: deduped, totalIssues: deduped.length, markdown: bugsReport({ code, language, bugs: deduped }) };
}

async function optimizeCode({ code, language }) {
  const suggestions = [];
  let optimizedCode = code;
  const isCli = /^\s*(git|pm2|npm|yarn|pip|docker|systemctl|npx|curl|wget)\b/im.test(code);

  if (isCli) {
    const trimmed = code.trim();
    if (/git\s+clone/i.test(trimmed) && !/--depth/i.test(trimmed)) {
      suggestions.push({
        title: "Use Shallow Repository Clone (--depth 1)",
        description: "Adding --depth 1 downloads only the latest commit snapshot instead of full historical commits, saving up to 90% bandwidth and clone time.",
        impact: "high",
      });
      optimizedCode = trimmed.replace(/git\s+clone\s+/i, "git clone --depth 1 ");
    } else if (/npm\s+(install|i)\b/i.test(trimmed) && !/ci|--only=production/i.test(trimmed)) {
      suggestions.push({
        title: "Use Fast Production Installation (npm ci)",
        description: "Replacing npm install with 'npm ci --only=production' bypasses package.json resolution and installs directly from package-lock.json up to 3x faster.",
        impact: "high",
      });
      optimizedCode = "# Fast Production Install\nnpm ci --only=production";
    } else if (/pm2\s+start/i.test(trimmed) && !/-i|cluster/i.test(trimmed)) {
      suggestions.push({
        title: "Enable Multi-Core Cluster Mode (-i max)",
        description: "Adding '-i max' instructs PM2 to spawn worker instances across all CPU cores, maximizing request throughput and load balancing.",
        impact: "high",
      });
      optimizedCode = trimmed.replace(/pm2\s+start\s+/i, "pm2 start ") + " -i max";
    } else {
      suggestions.push({
        title: "Optimized CLI Command Execution",
        description: "Configured command pipeline with optimal production flags for high execution speed.",
        impact: "medium",
      });
      optimizedCode = `# Optimized Command Pipeline\n${trimmed}`;
    }
  } else {
    if (/for.*for/s.test(code)) {
      suggestions.push({
        title: "Reduce nested loop complexity from O(n²) to O(n)",
        description: "Nested loops over collections can be replaced with a Hash Map lookup, cutting algorithmic time complexity significantly.",
        impact: "high",
      });
    }
    if (/\.forEach\(/.test(code) && /\.push\(/.test(code)) {
      suggestions.push({
        title: "Use .map() instead of forEach + push",
        description: "Replacing manual push accumulation with .map() is more declarative and avoids array mutation.",
        impact: "medium",
      });
    }
    if (/document\.querySelector/.test(code)) {
      suggestions.push({
        title: "Cache DOM lookups outside iteration",
        description: "Repeated querySelector calls inside loops slow down rendering; cache the element reference outside.",
        impact: "high",
      });
    }
    if (!suggestions.length) {
      suggestions.push({
        title: "Streamline Code Memory Footprint",
        description: "Replaced transient variable re-declarations with immutable const bindings and optimized memory allocation.",
        impact: "medium",
      });
    }
    optimizedCode = `// Optimized & Refactored Version\n${code.replace(/\bvar\s+/g, "const ").trim()}`;
  }

  return { suggestions, optimizedCode, markdown: optimizeReport({ language, suggestions, code }) };
}

async function complexityAnalysis({ code, language }) {
  const nestedLoops = (code.match(/for|while/g) || []).length;
  let big_o = "O(1)";
  if (nestedLoops === 1) big_o = "O(n)";
  else if (nestedLoops >= 2) big_o = "O(n^2)";
  const fnNameMatch = code.match(/function\s+(\w+)\s*\(/);
  const recursive = fnNameMatch
    ? new RegExp(`\\b${fnNameMatch[1]}\\s*\\(`, "g").test(code.slice(fnNameMatch.index + fnNameMatch[0].length))
    : false;
  if (recursive) big_o = "O(2^n) (recursive — verify base cases)";

  const timeComplexity = big_o;
  const spaceComplexity = /\[\]|\{\}/.test(code) ? "O(n)" : "O(1)";
  const explanation = `Estimated from static structure: ${nestedLoops} loop construct(s) detected${recursive ? ", with recursion present" : ""}.`;

  return {
    timeComplexity,
    spaceComplexity,
    explanation,
    markdown: complexityReport({ language: language || "code", timeComplexity, spaceComplexity, explanation }),
  };
}

async function securityScan({ code, language }) {
  const findings = [];
  const c = code.trim();

  if (/curl\s+[^|\n]+\|\s*(sh|bash)|wget\s+[^|\n]+\|\s*(sh|bash)/i.test(c)) {
    findings.push({ type: "Remote Code Execution (RCE)", severity: "critical", description: "Piping unverified internet scripts directly into shell execution (`curl | bash`).", recommendation: "Download and inspect remote scripts before execution." });
  }
  if (/chmod\s+777/.test(c)) {
    findings.push({ type: "Insecure File Permissions", severity: "high", description: "World-writable file permissions configured (`chmod 777`).", recommendation: "Use restrictive file permissions (644 for files, 755 for directories)." });
  }
  if (/\beval\s*\(|\bnew\s+Function\s*\(/i.test(c)) {
    findings.push({ type: "Unsafe Dynamic Code Evaluation (eval)", severity: "critical", description: "Executing arbitrary code strings via eval() or new Function().", recommendation: "Avoid eval(). Parse data structures safely using JSON.parse()." });
  }
  if (/\b(exec|spawn|system|popen)\s*\(/i.test(c)) {
    findings.push({ type: "OS Command Injection Vulnerability", severity: "critical", description: "Passing unvalidated inputs to shell command execution APIs.", recommendation: "Sanitize arguments or use parameterized subprocess execution." });
  }
  if (/(api[_-]?key|secret|password|auth_token|jwt_secret)\s*=\s*["'][^"']+["']/i.test(c) || /mongodb\+srv:\/\/[^:]+:[^@]+@/i.test(c)) {
    findings.push({ type: "Hardcoded Credentials & Secrets", severity: "critical", description: "Sensitive passwords, API keys, or database URI strings hardcoded in source code.", recommendation: "Store credentials in environment variables (`process.env` / `.env`) or a secrets manager." });
  }
  if (/SELECT .* \+ |query\(`.*\$\{/is.test(c)) {
    findings.push({ type: "SQL Injection (SQLi)", severity: "critical", description: "Building SQL query strings via dynamic string concatenation/template literals.", recommendation: "Use parameterized SQL queries (`?`) or an ORM." });
  }
  if (/innerHTML|dangerouslySetInnerHTML/.test(c)) {
    findings.push({ type: "Cross-Site Scripting (XSS)", severity: "high", description: "Unsanitized user content rendered directly into HTML DOM elements.", recommendation: "Use textContent or sanitize HTML strings using DOMPurify." });
  }
  if (/http:\/\/(?!localhost|127\.0\.0\.1)/i.test(c)) {
    findings.push({ type: "Insecure HTTP Transport", severity: "medium", description: "Communicating over unencrypted HTTP network endpoints.", recommendation: "Enforce HTTPS TLS encryption for all external API endpoints." });
  }
  if (/cors\(\s*\{\s*origin\s*:\s*["']\*["']/i.test(c)) {
    findings.push({ type: "Overly Permissive CORS Policy", severity: "medium", description: "Wildcard CORS origin (`*`) allows any third-party domain to access backend APIs.", recommendation: "Specify explicit trusted client origin domains." });
  }

  const riskLevel = findings.some((f) => f.severity === "critical") ? "critical" : findings.some((f) => f.severity === "high") ? "high" : findings.length ? "moderate" : "low";
  return { findings, riskLevel, markdown: securityReport({ language, findings, riskLevel }) };
}

async function generateDocumentation({ code, language, docType }) {
  const isCli = /^\s*(git|pm2|npm|yarn|pip|docker|systemctl|npx|curl|wget)\b/im.test(code);
  if (isCli) {
    const firstLine = code.split("\n")[0].trim();
    const cliDocsMarkdown = `### CLI Terminal Directives: \`${firstLine}\`
* **Type**: Shell Command / DevOps Directive
* **Description**: Executes command-line process manager or version control instructions.

#### Execution Arguments:
- \`${firstLine}\`: Main execution pipeline.

#### Operational Impact:
Executes environment tasks, dependency resolving, process monitoring, or repository cloning.
`;

    return {
      docType: "CLI / Shell Directives",
      documentedCode: `# Shell Script Documentation\n# Directive: ${firstLine}\n\n${code}`,
      markdown: `## 🐚 CLI Shell Command Documentation — \`${firstLine}\`

Auto-generated documentation for command-line instructions.

${cliDocsMarkdown}`,
      readme: `# CLI Script Documentation\n\n## Overview\nAuto-generated documentation for CLI execution commands: \`${firstLine}\`.\n\n## Execution\nRun directly inside terminal or shell environment.`,
    };
  }

  const funcs = new Set();
  const codeLines = code.split("\n");

  // Heuristic patterns for functions & classes
  const patterns = [
    /function\s+([a-zA-Z_$][\w$]*)/g,                                         // traditional JS/TS/PHP/Go functions
    /(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g, // Arrow functions
    /\bdef\s+([a-zA-Z0-9_]+)\s*\(/g,                                           // Python/Ruby defs
    /class\s+([a-zA-Z0-9_]+)/g,                                                // Classes
    /\b(?:int|void|double|float|char|bool|auto|string|const\s+\w+)\s+([a-zA-Z0-9_]+)\s*\(/g // C/C++/Java type signatures
  ];

  patterns.forEach((regex) => {
    let m;
    while ((m = regex.exec(code)) !== null) {
      const name = m[1];
      if (name && !["if", "for", "while", "switch", "catch", "return"].includes(name)) {
        funcs.add(name);
      }
    }
  });

  const symbols = Array.from(funcs);

  let funcDocsMarkdown = "";
  if (symbols.length > 0) {
    funcDocsMarkdown = symbols.map((f) => {
      let desc = "Performs utility operations and data logic execution.";
      let paramLines = [];
      let paramNames = [];
      let returnType = "any";
      let returnDesc = "Void / undefined";

      // 1. Extract exact parameters from function signature
      const paramRegex = new RegExp(`(?:function\\s+${f}|${f}\\s*=\\s*(?:async\\s*)?\\(|def\\s+${f}\\s*\\(|class\\s+${f}|\\b\\w+\\s+${f}\\s*\\()\\s*\\(([^)]*)\\)`, "i");
      const paramMatch = code.match(paramRegex);
      if (paramMatch && paramMatch[1].trim()) {
        paramNames = paramMatch[1].split(",").map((p) => p.trim().split(/[\s=:]+/)[0].trim()).filter(Boolean);
        paramLines = paramNames.map((p) => `- \`${p}\` (any): Input argument.`);
      }

      // 2. Detect return value/statement from body
      const bodyMatch = code.match(new RegExp(`(?:function\\s+${f}|def\\s+${f})[\\s\\S]*?\\{([\\s\\S]*?)\\}`, "i"));
      const bodyText = bodyMatch ? bodyMatch[1] : code;
      const returnMatch = bodyText.match(/return\s+([^;\n]+)/i);
      if (returnMatch) {
        const retExpr = returnMatch[1].trim();
        returnType = retExpr.startsWith("[") ? "Array" : retExpr.startsWith("{") ? "Object" : retExpr === "true" || retExpr === "false" ? "boolean" : "any";
        returnDesc = `- \`${returnType}\`: Returns \`${retExpr}\`.`;
      }

      // 3. Smart description based on function name
      const fl = f.toLowerCase();
      if (fl.includes("duplicate") || fl.includes("dupe")) {
        desc = "Identifies and extracts duplicate values from the input collection.";
      } else if (fl.includes("sort") || fl.includes("order")) {
        desc = "Arranges input items according to specified ordering rules.";
      } else if (fl.includes("filter") || fl.includes("find") || fl.includes("search")) {
        desc = "Searches input dataset and retrieves matching elements.";
      } else if (fl.includes("connect") || fl.includes("db") || fl.includes("mongo")) {
        desc = "Initiates and manages asynchronous database connection lifecycle.";
      } else if (fl.includes("add") || fl.includes("sum") || fl.includes("count")) {
        desc = "Computes mathematical or aggregate operations on arguments.";
      } else if (fl.includes("auth") || fl.includes("login") || fl.includes("token")) {
        desc = "Handles authentication requests, credential verification, and token issuance.";
      }

      const paramsText = paramLines.length > 0 ? paramLines.join("\n") : "None";

      const jsdocParams = paramNames.length > 0
        ? paramNames.map((p) => ` * @param {any} ${p} - Input parameter`).join("\n")
        : " * @param {any} [args] - Function arguments";

      const jsdocReturn = returnMatch ? ` * @returns {${returnType}} Returned result (\`${returnMatch[1].trim()}\`)` : " * @returns {void}";

      return `### \`${f}\`
* **Type**: Function / Symbol
* **Description**: ${desc}

#### Parameters:
${paramsText}

#### Returns:
${returnDesc}

\`\`\`javascript
/**
 * Auto-generated JSDoc for ${f}
 * @description ${desc}
${jsdocParams}
${jsdocReturn}
 */
\`\`\`
---
`;
    }).join("\n");
  } else {
    funcDocsMarkdown = "### Code Logic Block\nNo named function signatures or class schemas were statically detected in this code. The snippet was analyzed as a single top-level executable block.\n\n* **Primary Execution**: Sequence of expressions executed sequentially.\n";
  }

  let documentedCode = code;
  const isPython = (language || "").toLowerCase() === "python";
  if (symbols.length > 0) {
    const blocks = symbols.map((f) => {
      let desc = "Performs utility operations and data logic execution.";
      let paramNames = [];
      let returnType = isPython ? "list / object" : "any";

      const paramRegex = new RegExp(`(?:function\\s+${f}|${f}\\s*=\\s*(?:async\\s*)?\\(|def\\s+${f}\\s*\\(|class\\s+${f}|\\b\\w+\\s+${f}\\s*\\()\\s*\\(([^)]*)\\)`, "i");
      const paramMatch = code.match(paramRegex);
      if (paramMatch && paramMatch[1].trim()) {
        paramNames = paramMatch[1].split(",").map((p) => p.trim().split(/[\s=:]+/)[0].trim()).filter(Boolean);
      }

      const bodyMatch = code.match(new RegExp(`(?:function\\s+${f}|def\\s+${f})[\\s\\S]*?(?:\\{|\n\\s*return|\n\\s*print)([\\s\\S]*?)(?=\n[a-zA-Z]|\n\\S|$)`, "i"));
      const bodyText = bodyMatch ? bodyMatch[1] : code;
      const returnMatch = code.match(/return\s+([^;\n#]+)/i);
      if (returnMatch) {
        const retExpr = returnMatch[1].trim();
        returnType = retExpr.startsWith("[") ? (isPython ? "list" : "Array") : retExpr.startsWith("{") ? (isPython ? "dict" : "Object") : retExpr === "True" || retExpr === "False" || retExpr === "true" || retExpr === "false" ? "bool" : "any";
      }

      const fl = f.toLowerCase();
      if (fl.includes("read") || fl.includes("parse") || fl.includes("file")) {
        desc = "Opens and reads specified file path, parsing lines into structured collection with error handling.";
      } else if (fl.includes("duplicate") || fl.includes("dupe")) {
        desc = "Identifies and extracts duplicate values from the input collection.";
      } else if (fl.includes("sort") || fl.includes("order")) {
        desc = "Arranges input items according to specified ordering rules.";
      } else if (fl.includes("filter") || fl.includes("find") || fl.includes("search")) {
        desc = "Searches input dataset and retrieves matching elements.";
      }

      if (isPython) {
        const pyParams = paramNames.length > 0 ? paramNames.map((p) => `    :param ${p}: Input argument`).join("\n") : "    :param args: Function arguments";
        const pyReturn = returnMatch ? `    :return ${returnType}: Returned result (${returnMatch[1].trim()})` : "    :return: None";
        return `"""\n${desc}\n\n${pyParams}\n${pyReturn}\n"""`;
      }

      const jsdocParams = paramNames.length > 0
        ? paramNames.map((p) => ` * @param {any} ${p} - Input parameter`).join("\n")
        : " * @param {any} [args] - Function arguments";
      const jsdocReturn = returnMatch ? ` * @returns {${returnType}} Returned result (\`${returnMatch[1].trim()}\`)` : " * @returns {void}";

      return `/**\n * ${desc}\n${jsdocParams}\n${jsdocReturn}\n */`;
    });
    documentedCode = `${blocks.join("\n\n")}\n${code}`;
  }

  return {
    docType: docType || "function",
    documentedCode,
    markdown: documentationReport({ language, docType, funcs: symbols, funcDocsMarkdown }),
    readme: `# ${language.toUpperCase()} Code Snippet Documentation\n\n## Overview\nAuto-generated documentation for this ${language} script.\n\n## Exported Symbols\n${symbols.length ? symbols.map((s) => `- \`${s}\``).join("\n") : "- Top-level logic execution"}\n\n## Setup & Execution\nEnsure you have the target execution environment installed for ${language}.`,
  };
}

/* ─── Static converters for common language pairs ─────────────────────────── */

function cssToObject(code) {
  const blocks = [];
  const blockRe = /([^{}]+)\{([^}]*)\}/g;
  let m;
  while ((m = blockRe.exec(code)) !== null) {
    const selector = m[1].trim();
    const props = m[2]
      .split(";")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, ...rest] = l.split(":");
        return { name: name.trim(), value: rest.join(":").trim() };
      });
    if (props.length) blocks.push({ selector, props });
  }
  return blocks;
}

function convertCssToPython(code) {
  const blocks = cssToObject(code);
  if (!blocks.length) return `# No CSS blocks found\ncss = {}\n`;

  const pyBlocks = blocks.map(({ selector, props }) => {
    const dictName = selector
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/__+/g, "_")
      .toLowerCase() || "styles";
    const entries = props
      .map(({ name, value }) => `    "${name}": "${value}"`)
      .join(",\n");
    return `${dictName} = {\n${entries}\n}`;
  });

  return `# Auto-converted from CSS to Python\n# Each CSS block becomes a Python dictionary.\n\n${pyBlocks.join("\n\n")}`;
}

function convertCssToJs(code) {
  const blocks = cssToObject(code);
  if (!blocks.length) return `// No CSS blocks found\nconst styles = {};\n`;

  const jsBlocks = blocks.map(({ selector, props }) => {
    const varName = selector
      .replace(/[^a-zA-Z0-9_$]/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/__+/g, "_")
      .replace(/^(.)/, (c) => c.toLowerCase()) || "styles";
    const entries = props
      .map(({ name, value }) => `  ${name.includes("-") ? `"${name}"` : name}: "${value}"`)
      .join(",\n");
    return `const ${varName} = {\n${entries}\n};`;
  });

  return `// Auto-converted from CSS to JavaScript\n\n${jsBlocks.join("\n\n")}`;
}

function convertJsToC(code) {
  const lines = code.split("\n");
  const functions = [];
  const mainBody = [];
  let inFunction = false;
  let currentFunc = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/.test(trimmed)) {
      inFunction = true;
      const m = trimmed.match(/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/);
      const name = m[1];
      const params = m[2].split(",").map(p => p.trim()).filter(Boolean);
      const typedParams = params.map(p => `int ${p}`).join(", ");
      currentFunc.push(`int ${name}(${typedParams}) {`);
      continue;
    }

    if (inFunction) {
      if (trimmed === "}") {
        currentFunc.push("}");
        functions.push(currentFunc.join("\n"));
        currentFunc = [];
        inFunction = false;
      } else {
        currentFunc.push(line);
      }
      continue;
    }

    if (!trimmed) continue;

    let cLine = line
      .replace(/\b(?:const|let|var)\s+(\w+)\s*=\s*/g, "int $1 = ")
      .replace(/console\.log\s*\(\s*["']([^"']+)["']\s*,\s*([^)]+)\)\s*;?/g, 'printf("$1 %d\\n", $2);')
      .replace(/console\.log\s*\(\s*([^)]+)\)\s*;?/g, 'printf("%d\\n", $1);');

    if (!cLine.trim().endsWith(";") && !cLine.trim().endsWith("}")) {
      cLine += ";";
    }
    mainBody.push("    " + cLine.trim());
  }

  const funcBlock = functions.length ? functions.join("\n\n") + "\n\n" : "";
  const mainBlock = `int main() {\n${mainBody.join("\n")}\n\n    return 0;\n}`;

  return `#include <stdio.h>\n\n${funcBlock}${mainBlock}`;
}

function convertJsToCpp(code) {
  const lines = code.split("\n");
  const functions = [];
  const mainBody = [];
  let inFunction = false;
  let currentFunc = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/.test(trimmed)) {
      inFunction = true;
      const m = trimmed.match(/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/);
      const name = m[1];
      const params = m[2].split(",").map(p => p.trim()).filter(Boolean);
      const typedParams = params.map(p => `int ${p}`).join(", ");
      currentFunc.push(`int ${name}(${typedParams}) {`);
      continue;
    }

    if (inFunction) {
      if (trimmed === "}") {
        currentFunc.push("}");
        functions.push(currentFunc.join("\n"));
        currentFunc = [];
        inFunction = false;
      } else {
        currentFunc.push(line);
      }
      continue;
    }

    if (!trimmed) continue;

    let cppLine = line
      .replace(/\b(?:const|let|var)\s+(\w+)\s*=\s*/g, "int $1 = ")
      .replace(/console\.log\s*\(\s*["']([^"']+)["']\s*,\s*([^)]+)\)\s*;?/g, 'cout << "$1 " << $2 << endl;')
      .replace(/console\.log\s*\(\s*([^)]+)\)\s*;?/g, 'cout << $1 << endl;');

    if (!cppLine.trim().endsWith(";") && !cppLine.trim().endsWith("}")) {
      cppLine += ";";
    }
    mainBody.push("    " + cppLine.trim());
  }

  const funcBlock = functions.length ? functions.join("\n\n") + "\n\n" : "";
  const mainBlock = `int main() {\n${mainBody.join("\n")}\n\n    return 0;\n}`;

  return `#include <iostream>\nusing namespace std;\n\n${funcBlock}${mainBlock}`;
}

function convertJsToJava(code) {
  const lines = code.split("\n");
  const functions = [];
  const mainBody = [];
  let inFunction = false;
  let currentFunc = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/.test(trimmed)) {
      inFunction = true;
      const m = trimmed.match(/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/);
      const name = m[1];
      const params = m[2].split(",").map(p => p.trim()).filter(Boolean);
      const typedParams = params.map(p => `int ${p}`).join(", ");
      currentFunc.push(`    public static int ${name}(${typedParams}) {`);
      continue;
    }

    if (inFunction) {
      if (trimmed === "}") {
        currentFunc.push("    }");
        functions.push(currentFunc.join("\n"));
        currentFunc = [];
        inFunction = false;
      } else {
        currentFunc.push("    " + line);
      }
      continue;
    }

    if (!trimmed) continue;

    let javaLine = line
      .replace(/\b(?:const|let|var)\s+(\w+)\s*=\s*/g, "int $1 = ")
      .replace(/console\.log\s*\(\s*["']([^"']+)["']\s*,\s*([^)]+)\)\s*;?/g, 'System.out.println("$1 " + $2);')
      .replace(/console\.log\s*\(\s*([^)]+)\)\s*;?/g, 'System.out.println($1);');

    if (!javaLine.trim().endsWith(";") && !javaLine.trim().endsWith("}")) {
      javaLine += ";";
    }
    mainBody.push("        " + javaLine.trim());
  }

  const funcBlock = functions.length ? functions.join("\n\n") + "\n\n" : "";
  const mainBlock = `    public static void main(String[] args) {\n${mainBody.join("\n")}\n    }`;

  return `public class Main {\n${funcBlock}${mainBlock}\n}`;
}

function convertJsToGo(code) {
  const lines = code.split("\n");
  const functions = [];
  const mainBody = [];
  let inFunction = false;
  let currentFunc = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/.test(trimmed)) {
      inFunction = true;
      const m = trimmed.match(/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/);
      const name = m[1];
      const params = m[2].split(",").map(p => p.trim()).filter(Boolean);
      const typedParams = params.map(p => `${p} int`).join(", ");
      currentFunc.push(`func ${name}(${typedParams}) int {`);
      continue;
    }

    if (inFunction) {
      if (trimmed === "}") {
        currentFunc.push("}");
        functions.push(currentFunc.join("\n"));
        currentFunc = [];
        inFunction = false;
      } else {
        currentFunc.push(line);
      }
      continue;
    }

    if (!trimmed) continue;

    let goLine = line
      .replace(/\b(?:const|let|var)\s+(\w+)\s*=\s*/g, "$1 := ")
      .replace(/console\.log\s*\(\s*["']([^"']+)["']\s*,\s*([^)]+)\)\s*;?/g, 'fmt.Println("$1", $2)')
      .replace(/console\.log\s*\(\s*([^)]+)\)\s*;?/g, 'fmt.Println($1)');

    goLine = goLine.replace(/;$/, "");
    mainBody.push("    " + goLine.trim());
  }

  const funcBlock = functions.length ? functions.join("\n\n") + "\n\n" : "";
  const mainBlock = `func main() {\n${mainBody.join("\n")}\n}`;

  return `package main\n\nimport "fmt"\n\n${funcBlock}${mainBlock}`;
}

function convertJsToPython(code) {
  let out = code
    .replace(/\b(?:const|let|var)\s+(\w+)\s*=\s*/g, "$1 = ")
    .replace(/\(([^)]*)\)\s*=>\s*([^{\n;]+)/g, (_, params, body) => `lambda ${params}: ${body.trim()}`)
    .replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, "def $1($2):")
    .replace(/\/\/\s?/g, "# ")
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.split("\n").map((l) => `# ${l.replace(/\/\*|\*\//g, "").trim()}`).join("\n"))
    .replace(/console\.log\s*\(/g, "print(")
    .replace(/\btrue\b/g, "True")
    .replace(/\bfalse\b/g, "False")
    .replace(/\bnull\b/g, "None")
    .replace(/\bundefined\b/g, "None")
    .replace(/;(\s*)$/gm, "$1")
    .replace(/===/g, "==")
    .replace(/!==/g, "!=")
    .replace(/^\s*\}\s*$/gm, "");

  return `# Auto-converted from JavaScript to Python\n\n${out}`;
}

function convertPythonToJs(code) {
  let out = code
    .replace(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/gm, "function $1($2) {")
    .replace(/^\s*#\s?/gm, "// ")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null")
    .replace(/\bprint\s*\(/g, "console.log(")
    .replace(/^(\s*)(\w+)\s*=\s*(.+)$/gm, (_, indent, name, val) => {
      if (/^(function|if|for|while|const|let|var)/.test(name)) return _;
      return `${indent}const ${name} = ${val};`;
    })
    .replace(/f"([^"]*)"/g, (_, inner) => `\`${inner.replace(/\{(\w+)\}/g, "${$1}")}\``)
    .replace(/f'([^']*)'/g, (_, inner) => `\`${inner.replace(/\{(\w+)\}/g, "${$1}")}\``);

  return `// Auto-converted from Python to JavaScript\n\n${out}\n}`;
}

function convertHtmlToJsx(code) {
  let out = code
    .replace(/\bclass=/g, "className=")
    .replace(/\bfor=/g, "htmlFor=")
    .replace(/<!--([\s\S]*?)-->/g, "{/* $1 */}")
    .replace(/<(input|img|br|hr|link|meta)([^>]*?)(?<!\/)>/gi, "<$1$2 />");

  return `// Auto-converted from HTML to JSX\n\nexport default function Component() {\n  return (\n    <>\n${out.split("\n").map((l) => `      ${l}`).join("\n")}\n    </>\n  );\n}`;
}

function convertJsToTs(code) {
  let out = code
    .replace(/\b(const|let|var)\s+(\w+)\s*=\s*(\d+)/g, "$1 $2: number = $3")
    .replace(/\b(const|let|var)\s+(\w+)\s*=\s*"([^"]*)"/g, '$1 $2: string = "$3"')
    .replace(/\b(const|let|var)\s+(\w+)\s*=\s*true|false/g, "$1 $2: boolean = $3")
    .replace(/function\s+(\w+)\s*\(([^)]*)\)/g, "function $1($2): void");
  return `// Auto-converted from JavaScript to TypeScript\n\n${out}`;
}

function convertUniversal(code, fromLang, toLang) {
  let out = code
    .replace(/\b(?:const|let|var)\s+(\w+)\s*=\s*/g, "auto $1 = ")
    .replace(/console\.log\s*\(/g, "print(")
    .replace(/;$/gm, "");

  return `// Converted from ${fromLang} to ${toLang}\n\n${out}`;
}

function convertCodeToSql(code, from) {
  let tableLines = [];
  let insertLines = [];

  const kvRegex = /["']?([a-zA-Z0-9_/@.-]+)["']?\s*:\s*["']?([^"',}\n]+)["']?/g;
  let m;
  const entries = [];
  while ((m = kvRegex.exec(code)) !== null) {
    const rawKey = m[1];
    const key = rawKey.replace(/^@/, "pkg_").replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    const val = m[2].trim();
    if (key && val && !["name", "version", "dependencies", "devdependencies", "scripts", "type", "private"].includes(key)) {
      entries.push({ rawKey, key, val });
    }
  }

  if (entries.length > 0) {
    tableLines = entries.slice(0, 10).map((e) => `    ${e.key} VARCHAR(255)`);
    const cols = entries.slice(0, 10).map((e) => e.key).join(", ");
    const vals = entries.slice(0, 10).map((e) => `'${e.val.replace(/'/g, "''")}'`).join(", ");
    insertLines.push(`INSERT INTO application_dependencies (${cols})\nVALUES (${vals});`);
  }

  const columnsBlock = tableLines.length > 0 ? tableLines.join(",\n") : "    id INT PRIMARY KEY AUTO_INCREMENT,\n    item_name VARCHAR(255) NOT NULL,\n    item_value TEXT,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
  const insertsBlock = insertLines.length > 0 ? insertLines.join("\n\n") : "-- Sample INSERT query\nINSERT INTO application_dependencies (item_name, item_value) VALUES ('config_setting', 'enabled');";

  return `-- Auto-converted from ${from.toUpperCase() || "Source"} to SQL Schema & Queries

CREATE TABLE IF NOT EXISTS application_dependencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
${columnsBlock}
);

${insertsBlock}

-- Verification Query
SELECT * FROM application_dependencies;`;
}

async function convertCode({ code, fromLanguage, toLanguage }) {
  const from = (fromLanguage || "").toLowerCase().trim();
  const to = (toLanguage || "").toLowerCase().trim();

  const autoDetect = detectActualLanguage(code);
  const effectiveFrom = (autoDetect || from || "code").toLowerCase();
  const target = to.toLowerCase();

  let convertedCode = "";
  const notes = [];

  if (target === "c") {
    convertedCode = convertJsToC(code);
    notes.push("Converted logic into typed C code with int main() entrypoint.");
    notes.push("Added #include <stdio.h> and printf() formatting.");
  } else if (target === "cpp" || target === "c++") {
    convertedCode = convertJsToCpp(code);
    notes.push("Converted logic into modern C++ code with std::cout streams.");
    notes.push("Added #include <iostream> and namespace std.");
  } else if (target === "java") {
    convertedCode = convertJsToJava(code);
    notes.push("Encapsulated logic inside public class Main with public static void main(String[] args).");
    notes.push("Converted output to System.out.println().");
  } else if (target === "python" || target === "py") {
    convertedCode = convertJsToPython(code);
    notes.push("Converted syntax to Python 3 with indentation and def function signatures.");
    notes.push("Replaced outputs with print() and booleans with True/False.");
  } else if (target === "javascript" || target === "js" || target === "node") {
    convertedCode = convertPythonToJs(code);
    notes.push("Converted to modern ES6 JavaScript with const/let bindings.");
    notes.push("Replaced outputs with console.log().");
  } else if (target === "typescript" || target === "ts") {
    convertedCode = convertJsToTs(code);
    notes.push("Added explicit TypeScript type annotations (: string, : number, : void).");
  } else if (target === "go") {
    convertedCode = convertJsToGo(code);
    notes.push("Converted to Go syntax with package main and := short declarations.");
    notes.push("Replaced outputs with fmt.Println().");
  } else if (target === "sql") {
    convertedCode = convertCodeToSql(code, effectiveFrom);
    notes.push("Parsed code structure into relational CREATE TABLE and INSERT INTO DDL/DML statements.");
  } else if (target === "php") {
    convertedCode = `<?php\n// Auto-converted from ${effectiveFrom.toUpperCase()} to PHP\n\n${code.replace(/\b(?:const|let|var)\s+(\w+)/g, "$$$1").replace(/console\.log/g, "echo").replace(/;/g, ";")}\n?>`;
    notes.push("Wrapped in <?php ?> tags and added $ variable prefixes.");
  } else if (target === "jsx" || target === "react") {
    convertedCode = convertHtmlToJsx(code);
    notes.push("Converted HTML attributes to React JSX (className=, htmlFor=).");
  } else {
    convertedCode = convertUniversal(code, effectiveFrom, target);
    notes.push(`Transpiled logic from ${effectiveFrom.toUpperCase()} to ${target.toUpperCase()}.`);
  }

  return {
    convertedCode,
    notes,
    markdown: conversionReport({ fromLanguage: effectiveFrom, toLanguage: target, notes }),
  };
}

async function learningMode({ code, language, mode }) {
  const codeLower = code.toLowerCase();
  let base = {};

  if (codeLower.includes("git clone") || codeLower.includes("git commit") || codeLower.includes("git push") || codeLower.includes("git add") || codeLower.includes("git pull") || codeLower.includes("git branch")) {
    // Git & Version Control Masterclass
    base = {
      overview: `This ${language} snippet executes Git distributed version control commands. Git manages repository history, tracks line-by-line file changes across commit snapshots, enables team collaboration through branching and merging, and synchronizes local code with remote servers like GitHub.`,
      eli10: `Imagine a magical storybook. Every time you finish writing a page, you take a snapshot (\`git commit\`). \`git clone\` downloads a complete copy of the storybook from the internet library (\`GitHub\`) right onto your desk. When you make improvements, you push (\`git push\`) your new pages back to the library so everyone can read them!`,
      breakdown: `1. **Repository Synchronization**: Clones or pulls full commit history and source files from the remote Git server.\n2. **Staging Index (\`git add\`)**: Collects modified files into a staging area before creating a snapshot.\n3. **Commit Hash (\`git commit\`)**: Creates an immutable, SHA-hashed snapshot of current staged changes.\n4. **Remote Branch Push (\`git push\`)**: Uploads local commits to update the target origin branch on GitHub.`,
      realWorld: [
        `Used by engineering teams worldwide to collaborate on source code without overwriting each other's work.`,
        `Used by CI/CD automation tools (GitHub Actions, Jenkins) to trigger automated builds and deployments on new commits.`,
        `Used in open-source software development to accept community contributions via Pull Requests.`
      ],
      interviewQuestions: [
        `**Q: What is the difference between git fetch and git pull?**\n  *Answer*: \`git fetch\` downloads remote commits and updates without changing your local working directory. \`git pull\` runs \`git fetch\` followed immediately by \`git merge\`.`,
        `**Q: How does Git store project history internally?**\n  *Answer*: Git uses a Directed Acyclic Graph (DAG) of immutable commit objects identified by SHA hashes pointing to tree and blob objects.`
      ],
      exercises: [
        `1. Create a new branch named \`feature/auth\` using \`git checkout -b feature/auth\` and push it to remote.`,
        `2. Undo your last unpushed local commit while preserving file changes using \`git reset --soft HEAD~1\`.`,
        `3. Rebase your current feature branch onto main to apply updates cleanly.`
      ],
      quiz: [
        { question: `Which Git command copies a remote repository to your local computer?`, options: ["git pull", "git fetch", "git clone", "git copy"], answer: 2 },
      ],
      relatedConcepts: ["Distributed Version Control", "Directed Acyclic Graphs (DAG)", "Branching & Merging", "CI/CD Pipelines"],
    };
  } else if (codeLower.includes("pm2") || codeLower.includes("systemctl") || codeLower.includes("service")) {
    // Process Manager / Daemon Masterclass
    base = {
      overview: `This ${language} snippet manages production daemon processes. Process managers like PM2 keep backend Node.js applications running continuously in the background, auto-restart crashed processes, and restore services across server reboots.`,
      eli10: `Imagine a robot guardian standing over your web server. If your server stumbles and crashes, the guardian instantly revives it in half a second (\`auto-restart\`). \`pm2 save\` makes sure the guardian remembers to wake up and restart your server every time the main computer turns back on!`,
      breakdown: `1. **Daemon Spawning**: Launches target application as an isolated background daemon thread.\n2. **Crash Recovery**: Monitors process health and restarts crashed scripts instantly.\n3. **Process Listing**: Maintains active process IDs, memory usage metrics, and CPU usage.\n4. **Boot Persistence**: Saves state to automatically initialize services on system boot.`,
      realWorld: [
        `Used on Linux production servers to run Express/Node.js backends 24/7 without terminal windows remaining open.`,
        `Used in cloud virtual machines (EC2, DigitalOcean, Linode) for zero-downtime application reloads.`,
        `Used to manage multi-core cluster instances across CPU cores.`
      ],
      interviewQuestions: [
        `**Q: Why use a process manager like PM2 instead of running \`node server.js\` in a terminal?**\n  *Answer*: Closing the terminal kills \`node server.js\`. PM2 runs processes as background daemons, handles log rotation, restarts crashes, and persists state across reboots.`,
        `**Q: How does PM2 cluster mode improve performance?**\n  *Answer*: Node.js is single-threaded. PM2 cluster mode spawns multiple instances across available CPU cores and load-balances incoming requests.`
      ],
      exercises: [
        `1. Start a Node application in cluster mode across all CPU cores using \`pm2 start server.js -i max\`.`,
        `2. View live CPU and memory metrics for running processes using \`pm2 monit\`.`,
        `3. Configure automatic log rotation using \`pm2 install pm2-logrotate\`.`
      ],
      quiz: [
        { question: `What PM2 command saves active processes to auto-start on server reboot?`, options: ["pm2 save", "pm2 keep", "pm2 lock", "pm2 commit"], answer: 0 },
      ],
      relatedConcepts: ["Process Management", "Daemon Processes", "Cluster Mode", "System Boot Hooks"],
    };
  } else if (codeLower.includes("npm") || codeLower.includes("yarn") || codeLower.includes("pip") || codeLower.includes("npx")) {
    // Package Manager & CLI Masterclass
    base = {
      overview: `This ${language} snippet executes package manager and build CLI directives. Package managers automate downloading third-party libraries, resolving version dependencies, executing build compilers, and managing script lifecycles.`,
      eli10: `Imagine building a LEGO castle. Instead of making every single brick from scratch, you order pre-made special parts (like wheels or doors) from a catalog (\`npm\`). \`npm install\` downloads all your required parts, and \`npm run build\` glues your castle together for display!`,
      breakdown: `1. **Dependency Resolution**: Parses manifest file (\`package.json\` / \`requirements.txt\`) and builds dependency graph.\n2. **Package Fetching**: Downloads version-locked tarballs from registry (npm / PyPI) into local modules directory.\n3. **Lockfile Integrity**: Generates lockfiles (\`package-lock.json\`) to ensure reproducible builds across environments.\n4. **Compilation Script Execution**: Triggers build bundlers (Vite/Webpack) to output production bundles.`,
      realWorld: [
        `Used in modern web engineering to import tested open-source libraries (React, Express, Axios).`,
        `Used in automated CI/CD pipelines to install dependencies before executing test suites.`
      ],
      interviewQuestions: [
        `**Q: Why is package-lock.json important in team projects?**\n  *Answer*: It locks the exact sub-dependency versions installed. Without it, team members might get slightly different package versions, causing "works on my machine" bugs.`,
        `**Q: What is the difference between dependencies and devDependencies?**\n  *Answer*: \`dependencies\` are needed at runtime in production. \`devDependencies\` (like test runners, linters, compilers) are only needed during development/build time.`
      ],
      exercises: [
        `1. Add a new dependency to a project using \`npm install axios\`.`,
        `2. Check for security vulnerabilities in installed packages using \`npm audit\`.`,
        `3. Run a production build and inspect output files using \`npm run build\`.`
      ],
      quiz: [
        { question: `Which file locks exact installed package versions in npm?`, options: ["package-lock.json", "package.json", "node.json", "npm.config"], answer: 0 },
      ],
      relatedConcepts: ["Dependency Graphs", "Semantic Versioning (SemVer)", "Build Compilation", "Module Registries"],
    };
  } else if (codeLower.includes("connectdb") || codeLower.includes("mongoose") || codeLower.includes("mongo_uri") || codeLower.includes("database")) {
    // Database Connection Code (like db.js)
    base = {
      overview: `This ${language} snippet implements a database connection lifecycle manager. It securely retrieves connection strings from the environment, initiates an asynchronous connection hand-shake with a database cluster, handles potential network connection drops or auth failures gracefully, and exports the connection function.`,
      eli10: `Imagine you're plugging in a telephone line to dial a friend. First, you check if you have your friend's phone number on your sticky note (\`MONGO_URI\`). If you don't have it, you shout a warning and hang up. If you have it, you call them up (\`mongoose.connect()\`). If they pick up, you celebrate (\`connected\`). If the line is busy or dead, you catch the error and stop dialing!`,
      breakdown: `1. **Retrieving Configuration**: Pulls the Database connection URI from \`process.env\` to keep credentials secure.\n2. **Defensive Guard**: Checks if the URI is set before calling the database; prints a warning and short-circuits if not set.\n3. **Asynchronous Connection**: Triggers an async hand-shake (\`await mongoose.connect()\`) wrapped inside a try-catch block.\n4. **Logging & Success**: Upon successful handshake, it logs the connected host name.\n5. **Error Handling**: Gracefully catches failures, prints the stack trace, and shuts down the process with exit code 1.`,
      realWorld: [
        `Used in web backend applications to boot up connections to MongoDB, PostgreSQL, or MySQL before handling incoming user traffic.`,
        `Used in cloud microservices where environment configuration drives connection parameters dynamically.`,
        `Used in serverless functions (like AWS Lambda) to reuse connection instances across cold starts.`
      ],
      interviewQuestions: [
        `**Q: Why store MONGO_URI in process.env instead of hardcoding it?**\n  *Answer*: Hardcoding database credentials in code leaks passwords on GitHub. Environment variables allow different credentials for local, staging, and production environments.`,
        `**Q: What is the purpose of process.exit(1) in the catch block?**\n  *Answer*: An exit code of 1 signals to the OS/container runner (like Docker or PM2) that the service crashed. This triggers automatic restarts or deployments failure alerts.`
      ],
      exercises: [
        `1. Modify the connection function to retry the connection up to 3 times before calling process.exit(1).`,
        `2. Adapt the code to connect to a local SQLite fallback database if MONGO_URI is missing.`,
        `3. Write a connection timeout handler that stops attempting connection after 5 seconds.`
      ],
      quiz: [
        { question: `What does process.exit(1) represent?`, options: ["Normal exit without errors", "Abnormal exit (crash/error)", "Pause current thread", "Restart the server"], answer: 1 },
      ],
      relatedConcepts: ["Asynchronous Connections", "Environment Variables", "Process Life Cycles", "Database Connection Pools"],
    };
  } else if (codeLower.includes("addnumbers") || codeLower.includes("add") || codeLower.includes("return a + b") || codeLower.includes("sum") || (codeLower.includes("result") && codeLower.includes("num"))) {
    // Mathematical / Functional Code (like addNumbers)
    base = {
      overview: `This ${language} code showcases basic modular programming: declaring functions, passing arguments by value, returning computed results, and printing variables. It serves as the foundation of arithmetic computation.`,
      eli10: `Imagine you have a small toy factory robot named \`addNumbers\`. You hand it two boxes (boxes \`a\` and \`b\`). The robot's only job is to open the boxes, add the toys inside together, and hand you back a single box with the total count (\`return a + b\`). You put two toys in box 10 and three in box 20, send them to the robot, and then show the result to the room!`,
      breakdown: `1. **Function Signature**: Declares a reusable helper function accepting two input arguments.\n2. **Computation & Return**: Sums the inputs and returns the result to the caller.\n3. **Variable Assignment**: Creates local storage holders (\`num1\`, \`num2\`) for parameters.\n4. **Function Execution**: Invokes the function, passing in variables, and saves the output.\n5. **Standard Output**: Formats and prints the final output on screen.`,
      realWorld: [
        `Used in billing logic to sum item totals and taxes in shopping cart systems.`,
        `Used in game engines to calculate physics, player coordinates, and score aggregations.`,
        `Used in compiler arithmetic pipelines to optimize basic machine instructions.`
      ],
      interviewQuestions: [
        `**Q: What is the difference between passing arguments by value vs reference?**\n  *Answer*: By value passes a copy of the primitive data, meaning modifications inside the function do not affect the original variables. By reference passes a memory address, so changes affect original objects.`,
        `**Q: Why separate logic into a helper function instead of coding it inline?**\n  *Answer*: Reusability, readability, and testability. You can write automated tests specifically for the addition helper without running the whole main application.`
      ],
      exercises: [
        `1. Modify the addition helper to accept an array of numbers and return their sum.`,
        `2. Write a verification check that throws an error if any of the passed parameters are not numbers.`,
        `3. Implement a subtraction, multiplication, and division function, turning this into a basic calculator.`
      ],
      quiz: [
        { question: `What keyword is used to pass a computed value back out of a function?`, options: ["export", "yield", "send", "return"], answer: 3 },
      ],
      relatedConcepts: ["Modular Programming", "Call Stacks", "Scope & Lifetimes", "Function Overloading"],
    };
  } else if (codeLower.includes("app.use") || codeLower.includes("express") || codeLower.includes("server.js") || codeLower.includes("router")) {
    // Web Server / Routing Code (like server.js)
    base = {
      overview: `This ${language} code demonstrates how to bootstrap an HTTP API web server, attach middleware systems, mount routing endpoints, and spin up port listeners. It sets up request pipelines for clients to send data.`,
      eli10: `Imagine you're opening a restaurant. \`express\` is the restaurant building. Middleware (\`app.use\`) are the security guards at the door checking IDs or the waiters writing down orders. The routes (\`/api/auth\`) are different counters inside (e.g. burger counter vs salad counter). Clicking 'listen' is unlocking the front door to let customers come in!`,
      breakdown: `1. **Server Initialization**: Instantiates a web server framework instance.\n2. **Middleware Registration**: Hooks up general utilities (like parsers, logging, CORS) to run on every request.\n3. **Route Mounting**: Connects specific URL paths to dedicated router logic controllers.\n4. **Fallback Handling**: Registers not-found handlers and global error formatters.\n5. **Port Binding**: Starts listening for incoming network packets on a dedicated socket port.`,
      realWorld: [
        `Used in creating RESTful API backends for mobile apps, web apps, and webhooks.`,
        `Used in backend microservices to communicate with other services over JSON/HTTP.`,
        `Used in gateway proxies to rate-limit, authenticate, or log client requests.`
      ],
      interviewQuestions: [
        `**Q: What is middleware in Express?**\n  *Answer*: A function that has access to the Request (req) and Response (res) objects, and the 'next' function. It can execute code, modify req/res, and end the cycle or pass control to the next middleware.`,
        `**Q: What is the EADDRINUSE error, and how do you resolve it?**\n  *Answer*: It means another process is already listening on the same port. To resolve it, kill the other process or select a different, free port.`
      ],
      exercises: [
        `1. Add a rate-limiting middleware that blocks clients who send more than 10 requests per minute.`,
        `2. Create a basic logging middleware that prints the HTTP Method and URL of every request.`,
        `3. Add a GET /health endpoint that returns server uptime and DB status.`
      ],
      quiz: [
        { question: `What Express method binds the server to a network port?`, options: ["app.listen()", "app.bind()", "app.connect()", "app.start()"], answer: 0 },
      ],
      relatedConcepts: ["HTTP Protocol", "Middleware Architecture", "Routing & URI Mapping", "Sockets & Port Binding"],
    };
  } else {
    // Dynamic Fallback tailored to input code
    const firstLine = code.split("\n")[0].trim();
    base = {
      overview: `This ${language} snippet executes tailored logic starting with \`${firstLine.slice(0, 50)}\`. It handles sequence execution, variable bindings, and structural control flow.`,
      eli10: `Imagine following a recipe book. Each line of your code is an instruction telling the computer computer what ingredients to fetch and what steps to execute in order.`,
      breakdown: `1. **Sequence Execution**: Executes code statements sequentially line by line.\n2. **Memory Allocation**: Allocates memory holders for variables and functions.\n3. **Control Flow**: Branches execution paths based on evaluated runtime conditions.`,
      realWorld: [
        `Used in software applications to execute business domain logic.`,
        `Used in script utilities for task automation.`
      ],
      interviewQuestions: [
        `**Q: How does the interpreter/compiler execute this line by line?**\n  *Answer*: Code is parsed into an Abstract Syntax Tree (AST), checked for syntax errors, and executed sequentially in the call stack.`
      ],
      exercises: [
        `1. Refactor this snippet into a standalone reusable function.`,
        `2. Add error validation checking for edge cases.`
      ],
      quiz: [
        { question: `What component parses code into executable AST nodes?`, options: ["Compiler / Parser", "Database", "Network Gateway", "Operating System"], answer: 0 },
      ],
      relatedConcepts: ["Abstract Syntax Trees (AST)", "Call Stack Execution", "Control Flow"],
    };
  }

  return { mode: mode || "eli10", content: base, markdown: learningReport({ language, content: base }) };
}

module.exports = {
  name: "mock",
  explainCode,
  findBugs,
  optimizeCode,
  complexityAnalysis,
  securityScan,
  generateDocumentation,
  convertCode,
  learningMode,
  scoreFromCode,
};
