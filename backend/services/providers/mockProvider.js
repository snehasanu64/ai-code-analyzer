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

/* ── Auto-detect actual language from code heuristics ── */
function detectActualLanguage(code) {
  if (/\bconst\b|\blet\b|\bvar\b|\bfunction\b|\basync\b|\bawait\b|\brequire\s*\(|\bmodule\.exports\b|\bimport\b.*from/.test(code)) return "javascript";
  if (/\bdef\s+\w+\s*\(|\bimport\s+\w+|\bprint\s*\(|\bclass\s+\w+\s*:/.test(code)) return "python";
  if (/#include\s*<|\bprintf\s*\(|\bint\s+main\s*\(/.test(code)) return "c";
  if (/\bpublic\s+class\b|\bSystem\.out\.print|\bvoid\s+main\b/.test(code)) return "java";
  if (/SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE/i.test(code)) return "sql";
  return null;
}

async function findBugs({ code, language }) {
  const constructs = detectConstructs(code);
  const bugs = [];
  const codeLines = code.split("\n");

  const userLang   = (language || "").toLowerCase();
  const autoLang   = detectActualLanguage(code);
  const effectiveLang = autoLang || userLang;

  // Warn if the user has the wrong language selected
  if (autoLang && userLang && autoLang !== userLang && !userLang.startsWith(autoLang) && !autoLang.startsWith(userLang)) {
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
  if (/for.*for/s.test(code)) {
    suggestions.push({
      title: "Reduce nested loop complexity",
      description: "Nested loops over the same collection may be reducible with a hash map lookup, cutting time complexity from O(n²) to O(n).",
      impact: "high",
    });
  }
  if (/\.forEach\(/.test(code) && /\.push\(/.test(code)) {
    suggestions.push({
      title: "Use .map() instead of forEach + push",
      description: "Replacing manual push accumulation with .map() is more declarative and avoids mutation.",
      impact: "low",
    });
  }
  if (/document\.querySelector/.test(code)) {
    suggestions.push({
      title: "Cache DOM lookups",
      description: "Repeated querySelector calls inside loops are expensive; cache the reference outside the loop.",
      impact: "medium",
    });
  }
  if (!suggestions.length) {
    suggestions.push({
      title: "Code is already reasonably efficient",
      description: "No obvious micro-optimizations detected by static heuristics.",
      impact: "low",
    });
  }
  const optimizedCode = `// Optimized version\n${code}`;
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
  if (/SELECT .* \+ |query\(`.*\$\{/is.test(code)) {
    findings.push({ type: "SQL Injection", severity: "critical", description: "String concatenation/interpolation used to build a SQL query.", recommendation: "Use parameterized queries or an ORM." });
  }
  if (/innerHTML|dangerouslySetInnerHTML/.test(code)) {
    findings.push({ type: "XSS", severity: "high", description: "Untrusted content may be rendered directly as HTML.", recommendation: "Sanitize input or use safe text rendering APIs." });
  }
  if (/(api[_-]?key|secret|password)\s*=\s*["'][^"']+["']/i.test(code)) {
    findings.push({ type: "Hardcoded Secret", severity: "critical", description: "A credential-like literal was found in source code.", recommendation: "Move secrets to environment variables / a secrets manager." });
  }
  if (/csrf/i.test(code) === false && /app\.post|router\.post/.test(code)) {
    findings.push({ type: "CSRF", severity: "medium", description: "State-changing POST route with no visible CSRF protection.", recommendation: "Add CSRF tokens or verify same-site cookie policy." });
  }
  if (!/(validate|schema|joi|zod)/i.test(code) && /req\.body/.test(code)) {
    findings.push({ type: "Missing Validation", severity: "medium", description: "Request body used without visible validation.", recommendation: "Validate and sanitize all incoming request data." });
  }
  const riskLevel = findings.some((f) => f.severity === "critical") ? "critical" : findings.length ? "moderate" : "low";
  return { findings, riskLevel, markdown: securityReport({ language, findings, riskLevel }) };
}

async function generateDocumentation({ code, language, docType }) {
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

  return {
    docType: docType || "function",
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

async function convertCode({ code, fromLanguage, toLanguage }) {
  const from = (fromLanguage || "").toLowerCase().trim();
  const to = (toLanguage || "").toLowerCase().trim();

  let convertedCode = "";
  const notes = [];

  if ((from === "javascript" || from === "js") && to === "c") {
    convertedCode = convertJsToC(code);
    notes.push("Functions converted to C function signatures with typed parameters and int return.");
    notes.push("Top-level execution logic wrapped inside int main() block.");
    notes.push("console.log() translated to printf() with string format specifiers.");
    notes.push("Added #include <stdio.h> standard IO header.");
  } else if ((from === "javascript" || from === "js") && (to === "cpp" || to === "c++")) {
    convertedCode = convertJsToCpp(code);
    notes.push("Functions and top-level logic wrapped inside int main().");
    notes.push("console.log() translated to std::cout << ... << std::endl.");
    notes.push("Added #include <iostream> and using namespace std.");
  } else if ((from === "javascript" || from === "js") && to === "java") {
    convertedCode = convertJsToJava(code);
    notes.push("Wrapped functions as public static methods in public class Main.");
    notes.push("console.log() converted to System.out.println().");
    notes.push("Top-level execution logic wrapped inside public static void main(String[] args).");
  } else if ((from === "javascript" || from === "js") && to === "go") {
    convertedCode = convertJsToGo(code);
    notes.push("Functions converted to Go func syntax.");
    notes.push("Variables declared with Go short assignment := operator.");
    notes.push("console.log() converted to fmt.Println().");
  } else if (from === "css" && (to === "python" || to === "py")) {
    convertedCode = convertCssToPython(code);
    notes.push("Each CSS selector block is converted to a Python dictionary variable.");
  } else if (from === "css" && (to === "javascript" || to === "js")) {
    convertedCode = convertCssToJs(code);
    notes.push("Each CSS selector block is converted to a JavaScript const object.");
  } else if ((from === "javascript" || from === "js") && (to === "python" || to === "py")) {
    convertedCode = convertJsToPython(code);
    notes.push("const/let/var declarations converted to plain Python assignments.");
    notes.push("console.log() replaced with print().");
  } else if ((from === "python" || from === "py") && (to === "javascript" || to === "js")) {
    convertedCode = convertPythonToJs(code);
    notes.push("def … : blocks converted to function declarations.");
    notes.push("print() replaced with console.log().");
  } else if (from === "html" && (to === "jsx" || to === "react")) {
    convertedCode = convertHtmlToJsx(code);
    notes.push("class= → className=, for= → htmlFor=.");
  } else if ((from === "javascript" || from === "js") && to === "typescript") {
    convertedCode = convertJsToTs(code);
    notes.push("Basic type annotations added for literals.");
  } else {
    convertedCode = convertUniversal(code, fromLanguage, toLanguage);
    notes.push(`Transpiled from ${fromLanguage} to ${toLanguage}.`);
  }

  return {
    convertedCode,
    notes,
    markdown: conversionReport({ fromLanguage, toLanguage, notes }),
  };
}

async function learningMode({ code, language, mode }) {
  const codeLower = code.toLowerCase();
  let base = {};

  if (codeLower.includes("connectdb") || codeLower.includes("mongoose") || codeLower.includes("mongo_uri") || codeLower.includes("database")) {
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
    // Array Deduplication / Sets Code (Original base default)
    base = {
      overview: `This ${language} code implements an efficient, stateful processing pattern. It initializes dedicated memory structures to maintain unique records and processes input values iteratively.`,
      eli10: `Imagine you're checking guests at a party door with a guest list clipboard. When a guest arrives, you check if their name is on your list (\`seen.has()\`). If they are already on the list, you write their name in a "Duplicate Guests" notebook (\`dupes.push()\`). If they aren't on the list yet, you add them to the list (\`seen.add()\`). In the end, your notebook holds everyone who tried to enter twice!`,
      breakdown: `1. **Initialization**: Creates a Hash Set (\`new Set()\`) for $O(1)$ constant-time lookup and an empty array (\`[]\`) for duplicate collection.\n2. **Iteration**: Loop sequentially iterates through every element in the input list.\n3. **Condition Check & State Update**: Checks set membership; branches into array append or set insertion.\n4. **Result Delivery**: Returns the collected array of duplicate items.`,
      realWorld: [
        `Used in user sign-up systems to detect duplicate email registrations in real time.`,
        `Used in e-commerce applications to identify duplicate item additions in shopping carts.`,
        `Used in data pipeline ETL routines to deduplicate streaming events before database writes.`
      ],
      interviewQuestions: [
        `**Q: What is the time and space complexity of this approach?**\n  *Answer*: Time complexity is $O(n)$ where $n$ is array length because Set lookups/adds take $O(1)$ time. Space complexity is $O(u)$ where $u$ is the number of unique elements stored in the Set.`,
        `**Q: How does this compare to using nested loops or array \`.indexOf()\`?**\n  *Answer*: Using nested loops or array \`.indexOf()\` takes $O(n^2)$ time, which slows down dramatically for large datasets. Hash Set $O(1)$ lookup keeps it lightning fast.`
      ],
      exercises: [
        `1. Modify this snippet to return an object counting how many times each item appears instead of just returning duplicates.`,
        `2. Adapt this code to handle case-insensitive string duplication (e.g. treating "Apple" and "apple" as duplicates).`,
        `3. Write unit test cases testing edge cases: empty input, array with no duplicates, and array where all items are duplicates.`
      ],
      quiz: [
        { question: `What is the time complexity of Set.prototype.has()?`, options: ["O(1) Constant", "O(n) Linear", "O(n^2) Quadratic", "O(log n) Logarithmic"], answer: 0 },
      ],
      relatedConcepts: ["Hash Sets", "Iterative Traversal", "Time vs Space Trade-offs", "Deduplication Algorithms"],
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
