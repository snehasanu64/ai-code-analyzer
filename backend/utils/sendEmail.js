require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const nodemailer = require("nodemailer");

const emailUser = (process.env.EMAIL_USER || "testdev7353@gmail.com").trim();
const emailPass = (process.env.EMAIL_PASS || "bpmgrdwoscrkedrh").trim();

const pooledTransporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 5,
  maxMessages: 200,
  service: "gmail",
  auth: { user: emailUser, pass: emailPass },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const sslTransporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 5,
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: emailUser, pass: emailPass },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: { rejectUnauthorized: false },
});

async function sendOtpEmail({ to, name, otp }) {
  const recipient = to.trim();
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();

  const mailOptions = {
    from: `"AI Code Analyzer" <${emailUser}>`,
    replyTo: emailUser,
    to: recipient,
    subject: `🔐 Your AI Code Analyzer Verification OTP: ${otp}`,
    priority: "high",
    headers: {
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      "Importance": "high",
      "X-Mailer": "AI Code Analyzer UltraFast Relay",
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

  // 1. Try Resend HTTP REST API if RESEND_API_KEY environment variable is present
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [recipient],
          subject: mailOptions.subject,
          html: mailOptions.html,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        console.log(`[RESEND API SUCCESS] Delivered to ${recipient} in < 1s! ID: ${data.id}`);
        return { success: true, id: data.id };
      } else {
        console.warn(`[RESEND API WARN] (${data.message || "Restriction"}). Retrying pooled SMTP...`);
      }
    } catch (e) {
      console.warn(`[RESEND API ERROR] ${e.message}. Retrying pooled SMTP...`);
    }
  }

  // 2. Primary: Warm Pooled Transporter
  try {
    const info = await pooledTransporter.sendMail(mailOptions);
    console.log(`[WARM POOL SUCCESS] Delivered to ${recipient}! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err1) {
    console.warn(`[WARM POOL WARN] Pooled transport 1 failed (${err1.message}). Retrying SSL Pool...`);
  }

  // 3. Fallback: Warm SSL Pooled Transporter
  try {
    const info2 = await sslTransporter.sendMail(mailOptions);
    console.log(`[SSL POOL SUCCESS] Delivered to ${recipient}! Message ID: ${info2.messageId}`);
    return { success: true, messageId: info2.messageId };
  } catch (err2) {
    console.error(`[SMTP ERROR] Email dispatch failed for ${recipient}:`, err2.message);
    return { success: false, error: err2.message };
  }
}

module.exports = { sendOtpEmail };
