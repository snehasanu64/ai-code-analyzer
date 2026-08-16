require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const nodemailer = require("nodemailer");

async function sendOtpEmail({ to, name, otp }) {
  // 1. Try configured Gmail SMTP credentials if available
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const gmailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER.trim(),
          pass: process.env.EMAIL_PASS.trim(),
        },
      });

      const info = await gmailTransporter.sendMail({
        from: `"AI Code Analyzer" <${process.env.EMAIL_USER}>`,
        to,
        subject: `🔐 Your AI Code Analyzer Verification OTP: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #7c3aed; margin: 0;">AI Code Analyzer</h2>
              <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Email Verification Code</p>
            </div>
            <p style="font-size: 15px; color: #1f2937;">Hello <strong>${name || to}</strong>,</p>
            <p style="font-size: 14px; color: #4b5563;">Use the following 6-digit OTP code to complete your registration and unlock the AI Code Analysis Workspace:</p>
            <div style="background-color: #f5f3ff; border: 2px dashed #7c3aed; padding: 16px; text-align: center; margin: 20px 0; border-radius: 12px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #5b21b6; font-family: monospace;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #6b7280;">This code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">AI Code Analyzer & Audit Suite &copy; ${new Date().getFullYear()}</p>
          </div>
        `,
      });

      console.log(`[GMAIL SUCCESS] Real OTP Email delivered to ${to}! Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (gmailErr) {
      console.warn(`[GMAIL SMTP WARN] Primary Gmail SMTP failed (${gmailErr.message}). Falling back to Ethereal Mail preview.`);
    }
  }

  // 2. Fallback: Ethereal Mail preview for testing
  try {
    const testAccount = await nodemailer.createTestAccount();
    const fallbackTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await fallbackTransporter.sendMail({
      from: `"AI Code Analyzer" <noreply@aicodeanalyzer.com>`,
      to,
      subject: `🔐 Your AI Code Analyzer Verification OTP: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #7c3aed; margin: 0;">AI Code Analyzer</h2>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Email Verification Code</p>
          </div>
          <p style="font-size: 15px; color: #1f2937;">Hello <strong>${name || to}</strong>,</p>
          <p style="font-size: 14px; color: #4b5563;">Use the following 6-digit OTP code to complete your registration and unlock the AI Code Analysis Workspace:</p>
          <div style="background-color: #f5f3ff; border: 2px dashed #7c3aed; padding: 16px; text-align: center; margin: 20px 0; border-radius: 12px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #5b21b6; font-family: monospace;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #6b7280;">This code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EMAIL PREVIEW] Ethereal Preview URL: ${previewUrl}`);
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (fallbackErr) {
    console.error(`[EMAIL ERROR] Fallback send failed:`, fallbackErr.message);
    return { success: false, error: fallbackErr.message };
  }
}

module.exports = { sendOtpEmail };
