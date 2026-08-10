/**
 * Shared prompt-building + JSON-schema instructions for real LLM providers
 * (openai, gemini). Every method must return JSON matching exactly what
 * mockProvider.js returns for that action — this is what keeps RightPanel.jsx
 * rendering correctly no matter which provider actually ran.
 */

const SCHEMAS = {
  explainCode: `Return ONLY valid JSON with this exact shape:
{
  "markdown": "a full markdown-formatted tutor-style explanation: a '# ✨ <Language> code breakdown' title, an intro sentence tuned to the requested explanation level, a '## What this code is doing' overview, a '## Line-by-line breakdown' section with each meaningful line shown in a fenced code block followed by a numbered explanation (and for beginner/intermediate levels, a short '✅ Why it matters' bullet list), a closing '## Summary' section, and one closing sentence offering a follow-up (e.g. a table format or a visual structure map)",
  "algorithms": ["short strings naming any recognizable algorithm or pattern"],
  "dataStructures": ["short strings naming data structures used"]
}`,
  findBugs: `Return ONLY valid JSON: { "bugs": [ { "line": number|null, "severity": "critical"|"warning"|"info", "title": string, "description": string, "suggestion": string } ], "totalIssues": number }`,
  optimizeCode: `Return ONLY valid JSON: { "suggestions": [ { "title": string, "description": string, "impact": "high"|"medium"|"low" } ], "optimizedCode": "the improved code as a string" }`,
  complexityAnalysis: `Return ONLY valid JSON: { "timeComplexity": "Big-O string", "spaceComplexity": "Big-O string", "explanation": "short plain-language reasoning" }`,
  securityScan: `Return ONLY valid JSON: { "findings": [ { "type": string, "severity": "critical"|"high"|"medium"|"low", "description": string, "recommendation": string } ], "riskLevel": "critical"|"moderate"|"low" }`,
  generateDocumentation: `Return ONLY valid JSON: { "docType": string, "markdown": "generated function/class/README documentation as markdown", "readme": "a short README stub as a string" }`,
  convertCode: `Return ONLY valid JSON: { "convertedCode": "the fully converted code as a string", "notes": ["short strings on key language-specific differences"] }`,
  learningMode: `Return ONLY valid JSON: { "mode": "eli10", "content": { "eli10": string, "realWorld": [string], "interviewQuestions": [string], "exercises": [string], "quiz": [ { "question": string, "options": [string], "answer": number } ], "relatedConcepts": [string] } }`,
};

function buildPrompt(method, args) {
  const { code, language, level, targetLanguage, fromLanguage, toLanguage, docType, mode } = args;
  const parts = [
    `You are an expert code analysis engine embedded in a product called AI Code Analyzer.`,
    `Task: ${method}`,
    language ? `Language: ${language}` : "",
    level ? `Explanation level: ${level}` : "",
    fromLanguage ? `Convert from: ${fromLanguage}` : "",
    (toLanguage || targetLanguage) ? `Convert to: ${toLanguage || targetLanguage}` : "",
    docType ? `Documentation type: ${docType}` : "",
    mode ? `Learning mode: ${mode}` : "",
    `Code:\n\`\`\`${language || ""}\n${code}\n\`\`\``,
    SCHEMAS[method],
    `Do not include any prose, markdown fences, or commentary outside the JSON object itself.`,
  ];
  return parts.filter(Boolean).join("\n\n");
}

function safeParseJson(text) {
  const cleaned = text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

module.exports = { buildPrompt, safeParseJson };
