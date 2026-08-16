const http = require('http');

async function postJSON(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    }, (res) => {
      let resData = '';
      res.on('data', (chunk) => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getToken() {
  const email = `test8modes_${Date.now()}@example.com`;
  const reg = await postJSON('/api/auth/register', { name: 'Test Modes', email, password: 'password123' });
  if (reg.data && reg.data.token) return reg.data.token;
  throw new Error(`Auth failed: ${JSON.stringify(reg)}`);
}

async function testAll() {
  console.log("\n==============================================");
  console.log("  VERIFYING ALL 8 AI ANALYSIS MODES IN BACKEND");
  console.log("==============================================\n");

  const token = await getToken();
  console.log("🔑 Authenticated test user token retrieved successfully.\n");

  const testCases = [
    { path: '/api/analysis/explain', body: { code: 'sudo apt update && sudo apt install -y nodejs', language: 'auto' }, mode: '1. Explain Code' },
    { path: '/api/bugs/detect', body: { code: 'curl -fsSL https://example.com | sudo bash', language: 'auto' }, mode: '2. Audit Bugs' },
    { path: '/api/optimize', body: { code: 'git clone https://github.com/user/repo.git', language: 'auto' }, mode: '3. Optimize Performance' },
    { path: '/api/docs/generate', body: { code: 'pm2 start server.js --name backend', language: 'auto' }, mode: '4. Generate Docs' },
    { path: '/api/complexity', body: { code: 'for(let i=0; i<n; i++) { for(let j=0; j<n; j++) {} }', language: 'javascript' }, mode: '5. Complexity Analysis' },
    { path: '/api/security/scan', body: { code: 'const pass = "secret123"; chmod 777 /app', language: 'javascript' }, mode: '6. Security Scan' },
    { path: '/api/convert', body: { code: 'function hello() { console.log("world"); }', fromLanguage: 'javascript', toLanguage: 'python' }, mode: '7. Convert Language' },
    { path: '/api/learn', body: { code: 'git push origin main', language: 'auto' }, mode: '8. Learning Mode' },
  ];

  for (const tc of testCases) {
    const res = await postJSON(tc.path, tc.body, { 'Authorization': `Bearer ${token}` });
    if (res.status === 200 && res.data && res.data.success) {
      console.log(`✅ [PASS] ${tc.mode} (${tc.path}): Status 200 OK — Returned valid report payload`);
    } else {
      console.error(`❌ [FAIL] ${tc.mode} (${tc.path}): Status ${res.status} — ${JSON.stringify(res.data || res.raw)}`);
    }
  }

  console.log("\n==============================================\n");
}

testAll();
