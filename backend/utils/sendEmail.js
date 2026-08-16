require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const nodemailer = require("nodemailer");

async function sendOtpEmail({ to, name, otp }) {
  const recipient = to.trim();

  // Primary credentials & guaranteed fallback credentials
  const accounts = [];
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    accounts.push({
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.trim(),
    });
  }
  // Always include verified fallback account
  accounts.push({
    user: "testdev7353@gmail.com",
    pass: "bpmgrdwoscrkedrh",
  });

  const mailOptions = {
    to: recipient,
    subject: `🔐 Your AI Code Analyzer Verification OTP: ${otp}`,
    priority: "high",
    headers: {
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      "Importance": "high",
    },
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #7c3aed; margin: 0; font-size: 24px;">AI Code Analyzer</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Email Verification Code</p>
        </div>
        <p style="font-size: 15px; color: #1f2937;">Hello <strong>${name || recipient}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563;">Use the following 6-digit OTP code to complete your registration and unlock the AI Code Analysis Workspace:</p>
        <div style="background-color: #f5f3ff; border: 2px dashed #7c3aed; padding: 18px; text-align: center; margin: 24px 0; border-radius: 12px;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #5b21b6; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #6b7280;">This code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">AI Code Analyzer & Audit Suite &copy; ${new Date().getFullYear()}</p>
      </div>
    `,
  };

  // 1. Try Brevo / Resend HTTP REST API if provided
  if (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) {
    try {
      const apiKey = (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY).trim();
      const isResend = !!process.env.RESEND_API_KEY;
      const endpoint = isResend ? "https://api.resend.com/emails" : "https://api.brevo.com/v3/smtp/email";
      const headers = isResend
        ? { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
        : { "api-key": apiKey, "Content-Type": "application/json", "accept": "application/json" };

      const body = isResend
        ? JSON.stringify({
            from: "AI Code Analyzer <onboarding@resend.dev>",
            to: [recipient],
            subject: mailOptions.subject,
            html: mailOptions.html,
          })
        : JSON.stringify({
            sender: { name: "AI Code Analyzer", email: accounts[0].user },
            to: [{ email: recipient, name: name || recipient }],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
          });

      const res = await fetch(endpoint, { method: "POST", headers, body });
      const data = await res.json();
      if (res.ok) {
        console.log(`[HTTP API SUCCESS] Real OTP Email delivered to ${recipient}!`);
        return { success: true, id: data.id || data.messageId };
      }
    } catch (apiErr) {
      console.warn(`[HTTP API WARN] API failed (${apiErr.message}). Retrying SMTP...`);
    }
  }

  // 2. Loop through all accounts with 3 transport strategies each (Gmail Service -> Port 587 TLS -> Port 465 SSL)
  for (const acc of accounts) {
    mailOptions.from = `"AI Code Analyzer" <${acc.user}>`;
    mailOptions.replyTo = acc.user;

    // Strategy A: Gmail Service
    try {
      const t1 = nodemailer.createTransport({
        service: "gmail",
        auth: { user: acc.user, pass: acc.pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
      });
      const info = await t1.sendMail(mailOptions);
      console.log(`[GMAIL SERVICE SUCCESS] (${acc.user}) OTP delivered to ${recipient}! ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (e1) {
      console.warn(`[GMAIL SERVICE WARN] (${acc.user}) Failed (${e1.message}). Retrying Port 587 TLS...`);
    }

    // Strategy B: Explicit Port 587 TLS
    try {
      const t2 = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: acc.user, pass: acc.pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        tls: { rejectUnauthorized: false },
      });
      const info2 = await t2.sendMail(mailOptions);
      console.log(`[GMAIL 587 TLS SUCCESS] (${acc.user}) OTP delivered to ${recipient}! ID: ${info2.messageId}`);
      return { success: true, messageId: info2.messageId };
    } catch (e2) {
      console.warn(`[GMAIL 587 TLS WARN] (${acc.user}) Failed (${e2.message}). Retrying Port 465 SSL...`);
    }

    // Strategy C: Explicit Port 465 SSL
    try {
      const t3 = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: acc.user, pass: acc.pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        tls: { rejectUnauthorized: false },
      });
      const info3 = await t3.sendMail(mailOptions);
      console.log(`[GMAIL 465 SSL SUCCESS] (${acc.user}) OTP delivered to ${recipient}! ID: ${info3.messageId}`);
      return { success: true, messageId: info3.messageId };
    } catch (e3) {
      console.error(`[GMAIL 465 SSL ERROR] (${acc.user}) Failed (${e3.message}).`);
    }
  }

  return { success: false, error: "All email transports exhausted" };
}

module.exports = { sendOtpEmail };
