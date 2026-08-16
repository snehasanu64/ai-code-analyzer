require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const nodemailer = require("nodemailer");

async function sendOtpEmail({ to, name, otp }) {
  const emailUser = (process.env.EMAIL_USER || "testdev7353@gmail.com").trim();
  const emailPass = (process.env.EMAIL_PASS || "bpmgrdwoscrkedrh").trim();
  const recipient = to.trim();

  // 1. Try Brevo / Resend / Transactional HTTP REST API (Super-fast < 400ms, no SMTP socket hangs)
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
            subject: `🔐 Your AI Code Analyzer Verification OTP: ${otp}`,
            html: `<div style="font-family: Arial; padding: 24px; text-align: center;"><h2>AI Code Analyzer</h2><p>Your 6-digit OTP code is:</p><h1 style="color:#7c3aed; letter-spacing: 6px;">${otp}</h1></div>`,
          })
        : JSON.stringify({
            sender: { name: "AI Code Analyzer", email: emailUser },
            to: [{ email: recipient, name: name || recipient }],
            subject: `🔐 Your AI Code Analyzer Verification OTP: ${otp}`,
            htmlContent: `<div style="font-family: Arial; padding: 24px; text-align: center;"><h2>AI Code Analyzer</h2><p>Your 6-digit OTP code is:</p><h1 style="color:#7c3aed; letter-spacing: 6px;">${otp}</h1></div>`,
          });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(endpoint, { method: "POST", headers, body, signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (res.ok) {
        console.log(`[HTTP API SUCCESS] Delivered to ${recipient}!`);
        return { success: true, id: data.id || data.messageId };
      }
    } catch (apiErr) {
      console.warn(`[HTTP API WARN] API failed (${apiErr.message}). Retrying fast SMTP...`);
    }
  }

  // 2. Fast Gmail SMTP Transport with 3-second Socket Timeout Safeguard
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
      connectionTimeout: 3000, // 3s max connection timeout
      greetingTimeout: 3000,
      socketTimeout: 3000,     // 3s max socket timeout
    });

    const mailOptions = {
      from: `"AI Code Analyzer" <${emailUser}>`,
      replyTo: emailUser,
      to: recipient,
      subject: `🔐 Your AI Code Analyzer Verification OTP: ${otp}`,
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`[GMAIL FAST SUCCESS] Delivered to ${recipient}! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[GMAIL FAST ERROR] Email dispatch failed for ${recipient}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendOtpEmail };
