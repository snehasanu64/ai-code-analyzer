const aiService = require("../services/aiService");

const generateCodeFromPrompt = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required" });
    }

    const providerName = (process.env.AI_PROVIDER || "mock").toLowerCase();

    // If using real OpenAI API provider
    if (providerName === "openai" && process.env.OPENAI_API_KEY) {
      try {
        const apiKey = process.env.OPENAI_API_KEY;
        const system = `You are an expert coding AI assistant. When given a code request or prompt, generate clean, complete, modern, working source code. Respond in ONLY valid JSON matching this schema: {"text": "short 1-2 sentence explanation", "code": "the full generated code snippet"}`;
        const user = `Generate clean executable code for: ${prompt}`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: 0.3,
          }),
        });

        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          const cleaned = data.choices[0].message.content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
          const parsed = JSON.parse(cleaned);
          return res.json({ success: true, text: parsed.text || `Generated code for "${prompt}":`, code: parsed.code || "" });
        }
      } catch (err) {
        console.error("OpenAI chat error, using static fallback:", err.message);
      }
    }

    // Heuristic static fallback generator for sandbox/mock mode
    let text = `Here is a solution snippet for "${prompt}":`;
    let code = "";

    const pLower = prompt.toLowerCase();
    if (pLower.includes("python") || pLower.includes("py")) {
      code = `# Generated Python script for: ${prompt}\n\ndef main():\n    print("Executing solution for: ${prompt}")\n    # Add your custom logic here\n\nif __name__ == "__main__":\n    main()`;
    } else if (pLower.includes("react") || pLower.includes("component") || pLower.includes("jsx")) {
      code = `// Generated React Component for: ${prompt}\nimport { useState } from "react";\n\nexport default function CustomComponent() {\n  const [data, setData] = useState(null);\n\n  return (\n    <div className="p-4 border rounded-xl bg-white shadow-sm">\n      <h2 className="text-lg font-bold text-gray-900">${prompt}</h2>\n    </div>\n  );\n}`;
    } else if (pLower.includes("sql") || pLower.includes("query") || pLower.includes("table")) {
      code = `-- Generated SQL Query for: ${prompt}\nSELECT id, name, created_at\nFROM main_table\nWHERE status = 'active'\nORDER BY created_at DESC;`;
    } else if (pLower.includes("html") || pLower.includes("css") || pLower.includes("page")) {
      code = `<!-- Generated HTML Layout for: ${prompt} -->\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${prompt}</title>\n</head>\n<body>\n  <h1>${prompt}</h1>\n</body>\n</html>`;
    } else {
      code = `// Generated JavaScript function for: ${prompt}\nfunction executeTask() {\n  console.log("Processing: ${prompt}");\n  return { success: true, timestamp: new Date() };\n}\n\nexecuteTask();`;
    }

    return res.json({ success: true, text, code });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateCodeFromPrompt };
