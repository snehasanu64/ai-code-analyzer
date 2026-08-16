require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const nodemailer = require("nodemailer");

async function sendOtpEmail({ to, name, otp }) {
  const emailUser = (process.env.EMAIL_USER || "testdev7353@gmail.com").trim();
  const emailPass = (process.env.EMAIL_PASS || "bpmgrdwoscrkedrh").trim();

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `"AI Code Analyzer" <${emailUser}>`,
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
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[GMAIL SUCCESS] Real OTP Email delivered to ${to}! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[GMAIL ERROR] Email dispatch failed for ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendOtpEmail };
