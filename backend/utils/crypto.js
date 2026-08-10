/**
 * Symmetric encryption for storing user-supplied LLM API keys at rest.
 * Uses AES-256-GCM with a server-side secret (ENCRYPTION_KEY). Never store
 * or log the plaintext key anywhere else in the codebase.
 */
const crypto = require("crypto");

const ALGO = "aes-256-gcm";

function getKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is not set in .env — required to store workspace API keys.");
  }
  // Derive a stable 32-byte key from whatever-length secret string is provided
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store as iv:authTag:ciphertext, all hex
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

function decrypt(payload) {
  const [ivHex, authTagHex, dataHex] = payload.split(":");
  if (!ivHex || !authTagHex || !dataHex) throw new Error("Malformed encrypted payload");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

// Returns a masked preview like "sk-proj-••••••••wXyz" for display without exposing the full key
function maskKey(plainText) {
  if (!plainText || plainText.length < 8) return "••••••••";
  return `${plainText.slice(0, 7)}••••••••${plainText.slice(-4)}`;
}

module.exports = { encrypt, decrypt, maskKey };
