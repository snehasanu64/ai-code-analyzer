require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const nodemailer = require("nodemailer");

async function sendOtpEmail({ to, name, otp }) {
  const emailUser = (process.env.EMAIL_USER || "testdev7353@gmail.com").trim();
  const emailPass = (process.env.EMAIL_PASS || "bpmgrdwoscrkedrh").trim();
  const recipient = to.trim();

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
            sender: { name: "AI Code Analyzer", email: emailUser },
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
      console.warn(`[HTTP API WARN] API failed (${apiErr.message}). Retrying Gmail SMTP...`);
    }
  }

  // 2. Primary Transport: Gmail Service with generous 20-second cloud timeout
  try {
    const t1 = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000,
    });

    const info = await t1.sendMail(mailOptions);
    console.log(`[GMAIL SERVICE SUCCESS] Real OTP Email delivered to ${recipient}! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err1) {
    console.warn(`[GMAIL SERVICE WARN] Transport 1 failed (${err1.message}). Retrying Port 465 SSL...`);
  }

  // 3. Fallback Transport: Explicit SMTP Port 465 SSL
  try {
    const t2 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000,
      tls: { rejectUnauthorized: false },
    });

    const info2 = await t2.sendMail(mailOptions);
    console.log(`[GMAIL SSL SUCCESS] Real OTP Email delivered to ${recipient}! Message ID: ${info2.messageId}`);
    return { success: true, messageId: info2.messageId };
  } catch (err2) {
    console.error(`[GMAIL SSL ERROR] All email transports failed for ${recipient}:`, err2.message);
    return { success: false, error: err2.message };
  }
}

module.exports = { sendOtpEmail };
