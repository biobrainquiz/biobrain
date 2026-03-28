const { Resend } = require("resend");
const fs = require("fs");
const logger = require("../utils/logger");
const { getNormalDomain, getCleanDomain } = require("../utils/url.util");

async function sendExamReportEmail(useremail, username, filename, pdfpath) {

  const pdfBuffer = fs.readFileSync(pdfpath);

  try {

    const response = await resend.emails.send({

      from: "BioBrain <reports@biobrain.com>",

      to: useremail,

      subject: "Your BioBrain Test Performance Report",

      html: `
        <h2>Hello ${username},</h2>

        <p>Your <b>BioBrain Performance Analytics Report</b> is attached.</p>

        <p>
        Review your:
        <ul>
        <li>Performance summary</li>
        <li>Accuracy & score metrics</li>
        <li>Question-wise analysis</li>
        </ul>
        </p>

        <p>Keep learning and improving 🚀</p>

        <p><b>BioBrain Learning Platform</b></p>
      `,

      attachments: [
        {
          filename: filename,
          content: pdfBuffer
        }
      ]

    });

    return response;

  } catch (error) {
    logger.error("Error sending exam report email:", error);
    throw error;
  }

}

async function sendForgotPasswordEmail(user, resetURL) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const cleanDomain = getCleanDomain();
    const normalDomain = getNormalDomain();

    // ✅ Extract expiry from env and provide a fallback
    const expiryMin = process.env.EMAIL_EXPIRY_IN_MIN || 15;

    const supportSubject = encodeURIComponent(`Security Alert: ${user.username}`);
    const supportBody = encodeURIComponent(
      `Hello BioBrain Support,\n\nI received a password reset email for my account (${user.email}) that I did not request.\n\nUsername: ${user.username}`
    );
    const mailtoLink = `mailto:support@${cleanDomain}?subject=${supportSubject}&body=${supportBody}`;

    const response = await resend.emails.send({
      from: `BioBrain <no-reply@${cleanDomain}>`,
      to: user.email,
      replyTo: process.env.EMAIL_FROM || "biobrainquiz@gmail.com",
      subject: "Action Required: Reset Your BioBrain Password",
      text: `Reset your password here: ${resetURL}. This link expires in ${expiryMin} minutes.`,
      html: `
      <div style="background-color: #f1f5f9; padding: 50px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);">
          
          <div style="background-color: #3b82f6; height: 6px;"></div>
          <div style="padding: 40px;">
          <div style="margin-bottom: 30px;">
              <span style="font-size: 22px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px;">BioBrain</span>
            </div>
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em;">Password Reset Request</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hello <strong>${user.username}</strong>,
              <br><br>
              We received a request to change the password for your BioBrain account. Use the secure button below to proceed:
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetURL}" style="background-color: #1e293b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                <strong>Security Note:</strong> This link is valid for <strong>${expiryMin} minutes</strong>. If you did not request this change, please disregard this email. Your account remains secure.
              </p>
            </div>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 30px; text-align: center;">
              <p style="font-size: 13px; font-weight: 700; color: #526685; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">
                ${normalDomain}
              </p>
              <p style="font-size: 12px; color: #94a3b8; margin: 0 0 20px 0;">
                &copy; ${new Date().getFullYear()} BioBrain. All rights reserved.
              </p>
              <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; max-width: 400px; margin: 0 auto 20px auto;">
                This is an automated security notification. If you believe this request was made maliciously, please 
                <a href="${mailtoLink}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">contact our team</a>.
              </p>
              <div style="font-size: 11px; font-weight: 500;">
                <a href="${process.env.BASE_URI}/privacy" style="color: #64748b; text-decoration: none;">Privacy Policy</a>
                <span style="color: #e2e8f0; margin: 0 10px;">&bull;</span>
                <a href="${process.env.BASE_URI}/terms" style="color: #64748b; text-decoration: none;">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px; letter-spacing: 0.02em;">
          Designed for Excellence &bull; BioBrain Learning Platform
        </p>
      </div>`
    });

    if (response.error) throw new Error(response.error.message);
    return response.data;

  } catch (error) {
    console.error("Email Service Error:", error.message);
    throw error;
  }
}

module.exports = { sendExamReportEmail, sendForgotPasswordEmail };