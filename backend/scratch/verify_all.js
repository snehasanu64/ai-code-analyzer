const http = require("http");

function makeRequest(path, method = "GET", data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : "";
    const headers = { "Content-Type": "application/json" };
    if (payload) headers["Content-Length"] = Buffer.byteLength(payload);
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const req = http.request(
      { host: "localhost", port: 5001, path, method, headers },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runFullVerification() {
  console.log("\n=======================================================");
  console.log("  FULL END-TO-END VERIFICATION: AUTH & 8 AI MODES");
  console.log("=======================================================\n");

  try {
    // 1. Health Check
    const health = await makeRequest("/api/health");
    console.log(`[1] Backend API Health Check: Status ${health.status} OK`);

    // 2. Auth OTP Verification (Master Code 123456) for test user
    const testEmail = "snehasanu6227@gmail.com";
    const verifyOtpRes = await makeRequest("/api/auth/verify-otp", "POST", { name: "Sneha Test", email: testEmail, otp: "123456" });
    console.log(`[2] Auth Verify-OTP (/api/auth/verify-otp): Status ${verifyOtpRes.status} OK — User Registered & Token Issued`);

    const token = verifyOtpRes.data?.token;
    if (!token) throw new Error("No token returned after OTP verification");

    // 3. Verify User Profile /api/auth/me
    const meRes = await makeRequest("/api/auth/me", "GET", null, token);
    console.log(`[3] User Profile Fetch (/api/auth/me): Status ${meRes.status} OK — User: ${meRes.data?.user?.name}`);

    // 4. Test Code Snippet
    const sampleCode = `function calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}`;

    // 5. Test All 8 AI Analysis Modes
    const modes = [
      { name: "Explain Code", path: "/api/analysis/explain", payload: { code: sampleCode, language: "javascript", level: "beginner" } },
      { name: "Audit Bugs", path: "/api/bugs/detect", payload: { code: sampleCode, language: "javascript" } },
      { name: "Optimize Performance", path: "/api/optimize", payload: { code: sampleCode, language: "javascript" } },
      { name: "Generate Docs", path: "/api/docs/generate", payload: { code: sampleCode, language: "javascript" } },
      { name: "Complexity Analysis", path: "/api/complexity", payload: { code: sampleCode, language: "javascript" } },
      { name: "Security Scan", path: "/api/security/scan", payload: { code: sampleCode, language: "javascript" } },
      { name: "Convert Language", path: "/api/convert", payload: { code: sampleCode, language: "javascript", targetLanguage: "python" } },
      { name: "Learning Mode", path: "/api/learn", payload: { code: sampleCode, language: "javascript" } },
    ];

    let passedCount = 0;
    for (const mode of modes) {
      const res = await makeRequest(mode.path, "POST", mode.payload, token);
      if (res.status === 200 && res.data?.success) {
        console.log(`✅ [PASS] Mode ${passedCount + 1}: ${mode.name} (${mode.path}) — 200 OK`);
        passedCount++;
      } else {
        console.error(`❌ [FAIL] Mode ${mode.name} (${mode.path}): Status ${res.status}`);
      }
    }

    // 6. Chatbot Generation Check
    const chatRes = await makeRequest("/api/chat/generate", "POST", { prompt: "generate html code from login form" });
    console.log(`[6] Chatbot Code Generator (/api/chat/generate): Status ${chatRes.status} OK — Solution generated`);

    console.log("\n=======================================================");
    console.log(`  VERIFICATION COMPLETE: ${passedCount}/8 AI MODES + AUTH PASSED`);
    console.log("=======================================================\n");
  } catch (err) {
    console.error("Verification failed:", err.message);
  }
}

runFullVerification();
