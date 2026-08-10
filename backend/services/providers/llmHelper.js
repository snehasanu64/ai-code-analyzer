/**
 * Shared helper for real LLM providers (OpenAI, Gemini). Builds a schema-constrained
 * prompt per analysis type and calls the given provider's REST API directly (no SDK
 * dependency needed). Every method must return JSON matching mockProvider's shape,
 * since RightPanel.jsx renders based on that exact structure.
 */

const SCHEMA_BY_METHOD = {
  explainCode: `{"markdown": "a deep, comprehensive markdown-formatted walkthrough with an overview, an exhaustive line-by-line breakdown (explaining exact syntax, underlying data structure mechanics like Set/Array, time & space complexities, edge cases, and why each line matters), structural summary, and key takeaways — written like a senior staff software engineer and computer science instructor", "algorithms": ["short strings naming any recognizable algorithm/pattern"], "dataStructures": ["short strings naming data structures used"]}`,
  findBugs: `{"bugs": [{"line": number|null, "severity": "critical"|"warning"|"info", "title": "string", "description": "string", "suggestion": "string"}], "totalIssues": number, "markdown": "a full markdown-formatted bug-audit report with headers, a findings section per bug, and a closing summary — friendly senior-engineer tone"}`,
  optimizeCode: `{"suggestions": [{"title": "string", "description": "string", "impact": "high"|"medium"|"low"}], "optimizedCode": "the improved code as a clean string", "markdown": "a full markdown report starting with '# ⚡ AI Performance & Complexity Review', including '- **Analyzed Language:** ...', '- **Analysis Time:** ...', '## 📊 Complexity Score (Big O)' with estimated time & space complexity, and '## 💡 Optimizations & Clean Code Insights' with numbered insights"}`,
  complexityAnalysis: `{"timeComplexity": "Big-O string", "spaceComplexity": "Big-O string", "explanation": "string", "markdown": "a full markdown-formatted complexity report with headers and a plain-English closing summary"}`,
  securityScan: `{"findings": [{"type": "string", "severity": "critical"|"high"|"medium"|"low", "description": "string", "recommendation": "string"}], "riskLevel": "critical"|"moderate"|"low", "markdown": "a full markdown-formatted security report with headers, one section per finding, and a closing summary"}`,
  generateDocumentation: `{"markdown": "generated documentation in markdown, framed with headers and a closing summary in a friendly tutor tone", "readme": "a short README stub as a string"}`,
  convertCode: `{"convertedCode": "the fully transpiled code as a clean executable string", "notes": ["detailed notes explaining key language & syntax differences"], "markdown": "a complete markdown report with headers for Key Language Differences, Structural Mapping, and Environment Setup Instructions"}`,
  learningMode: `{"content": {"eli10": "string", "realWorld": ["string"], "interviewQuestions": ["string"], "exercises": ["string"], "quiz": [{"question": "string", "options": ["string"], "answer": number}], "relatedConcepts": ["string"]}, "markdown": "a full markdown-formatted learning-notes report with headers for each section and a closing summary"}`,
};

function buildPrompt(method, args) {
  const { code, language, level, targetLanguage, fromLanguage, toLanguage, docType, mode } = args;
  const schema = SCHEMA_BY_METHOD[method];
  const system = `You are the AI engine behind "AI Code Analyzer", a code-analysis SaaS tool. Respond with ONLY valid JSON matching this exact schema — no markdown fences, no prose outside the JSON:\n${schema}`;

  let task = "";
  switch (method) {
    case "explainCode": {
      const levelGuide =
        level === "beginner"
          ? "Target Audience: BEGINNER. Provide an extensive, friendly, deep line-by-line breakdown in plain simple English. Include a 'Concept Primer' section explaining the core topic with a real-world analogy. Explain every keyword (like const, let, Set, ternary ?, return) and why it's used."
          : level === "expert"
          ? "Target Audience: EXPERT. Provide a concise, high-level technical audit focusing on CS theory, algorithmic efficiency, Big-O bounds, memory complexity, and architecture patterns."
          : "Target Audience: INTERMEDIATE. Provide a balanced developer walkthrough detailing control flow, data structure mechanics, and time/space complexity.";

      task = `Explain this code.\n${levelGuide}\n\nCRITICAL LANGUAGE CHECK: If the user selected "${language}" in the dropdown, but the code is actually written in another language (e.g. selected HTML but the code is JavaScript, Python, C, etc.), YOU MUST start your markdown explanation with this alert banner at the very top:\n> ⚠️ **Language Mismatch:** The selected language is **${language}**, but this code is actually **[Detected Language]**.\nThen analyze the code according to its actual language.`;
      break;
    }
    case "findBugs":
      task = `Find bugs, risky patterns, and logic errors in this ${language} code.`;
      break;
    case "optimizeCode":
      task = `Suggest performance/readability optimizations for this ${language} code, and return an improved version.`;
      break;
    case "complexityAnalysis":
      task = `Analyze the time and space complexity of this ${language} code.`;
      break;
    case "securityScan":
      task = `Scan this ${language} code for security vulnerabilities (SQLi, XSS, CSRF, hardcoded secrets, missing validation, etc).`;
      break;
    case "generateDocumentation":
      task = `Generate ${docType || "function"}-level documentation and a short README for this ${language} code.`;
      break;
    case "convertCode":
      task = `Transpile this ${fromLanguage} code into idiomatic ${toLanguage}, preserving logic and control flow. Target Audience Level: ${level || "intermediate"}. Ensure the converted code is accurate, complete, clean, and ready to execute. Provide comprehensive conversion notes explaining key syntax and structural differences between ${fromLanguage} and ${toLanguage}.`;
      break;
    case "learningMode":
      task = `Create learning materials (ELI10 explanation, real-world examples, interview questions, exercises, a quiz, related concepts) for this ${language} code in "${mode || "eli10"}" mode.`;
      break;
    default:
      task = `Analyze this ${language} code.`;
  }

  const user = `${task}\n\n\`\`\`${language || ""}\n${code}\n\`\`\``;
  return { system, user };
}

function parseJsonResponse(text) {
  // Strip accidental markdown fences some models add despite instructions
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

async function callOpenAI({ apiKey, model, system, user }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`OpenAI API error (${res.status}): ${errBody.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty response");
  return parseJsonResponse(text);
}

async function callGemini({ apiKey, model, system, user }) {
  const candidates = [
    model,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ].filter(Boolean);

  const uniqueModels = [...new Set(candidates.map((m) => m.replace(/^models\//, "")))];

  let lastError = null;
  for (const modelName of uniqueModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
          }),
        }
      );
      if (res.status === 404) {
        const errText = await res.text().catch(() => "");
        lastError = new Error(`Gemini API error (404): ${errText.slice(0, 300)}`);
        continue;
      }
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Gemini API error (${res.status}): ${errBody.slice(0, 300)}`);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned an empty response");
      return parseJsonResponse(text);
    } catch (err) {
      if (err.message && err.message.includes("404")) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("Gemini API call failed for all model candidates.");
}

module.exports = { buildPrompt, callOpenAI, callGemini };
