require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

async function sendOtpEmail({ to, name, otp }) {
  const recipient = to.trim();
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();

  const mailOptions = {
    from: "AI Code Analyzer <onboarding@resend.dev>",
    to: [recipient],
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

  if (!resendApiKey) {
    console.error("[RESEND ONLY] RESEND_API_KEY environment variable missing.");
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      }),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      console.log(`[RESEND API SUCCESS] Real OTP email delivered to ${recipient}! ID: ${data.id}`);
      return { success: true, id: data.id };
    } else {
      console.error(`[RESEND API ERROR] ${recipient}: ${data.message || JSON.stringify(data)}`);
      return { success: false, error: data.message || "Resend API error" };
    }
  } catch (err) {
    console.error(`[RESEND API EXCEPTION] ${recipient}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = { sendOtpEmail };
