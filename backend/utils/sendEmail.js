require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const nodemailer = require("nodemailer");

const emailUser = (process.env.EMAIL_USER || "snehasanu7353@gmail.com").trim();
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

async function sendOtpEmail({ to, name, otp }) {
  const recipient = to.trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();
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

  // 1. Brevo API: Delivers to ANY email address in the world (No owner email restriction)
  if (brevoApiKey) {
    try {
      const senderEmail = (process.env.BREVO_SENDER_EMAIL || "snehasanu7353@gmail.com").trim();
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "AI Code Analyzer", email: senderEmail },
          to: [{ email: recipient, name: name || recipient }],
          subject: mailOptions.subject,
          htmlContent: mailOptions.html,
        }),
      });

      const data = await res.json();
      if (res.ok && data.messageId) {
        console.log(`[BREVO API SUCCESS] Real OTP Email delivered to ${recipient} in < 1s! ID: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      } else {
        console.warn(`[BREVO API WARN] ${recipient}: ${data.message || JSON.stringify(data)}. Retrying next transport...`);
      }
    } catch (e) {
      console.warn(`[BREVO API ERROR] ${recipient}: ${e.message}. Retrying next transport...`);
    }
  }

  // 2. Resend API
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AI Code Analyzer <onboarding@resend.dev>",
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
        console.warn(`[RESEND API WARN] ${recipient}: (${data.message || "Restriction"}). Retrying SMTP...`);
      }
    } catch (err) {
      console.warn(`[RESEND API ERROR] ${recipient}: ${err.message}. Retrying SMTP...`);
    }
  }

  // 3. Fallback Transporter for Friend Emails
  try {
    const info = await pooledTransporter.sendMail(mailOptions);
    console.log(`[SMTP FALLBACK SUCCESS] Real OTP email delivered to ${recipient}! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (smtpErr) {
    console.error(`[SMTP FALLBACK ERROR] ${recipient}: ${smtpErr.message}`);
    return { success: false, error: smtpErr.message };
  }
}

module.exports = { sendOtpEmail };
