const { Resend } = require("resend");
const fs = require("fs");
const logger = require("../utils/logger");

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


async function sendForgotPasswordEmail1(user, resetURL) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const response = await resend.emails.send({
    //from: '"BioBrain Support" <onboarding@resend.dev>', // or your verified domain
    from: "onboarding@resend.dev",
    to: user.email,
    subject: "Reset Your BioBrain Password",

    // ✅ KEEPING YOUR ORIGINAL MESSAGE (NO CHANGE)
    text: `
Reset Your BioBrain Password

We received a request to reset your password.

Click the link below:
${resetURL}

This link will expire in 10 minutes.

If you did not request this, please ignore this email.
      `,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

          <h2 style="color: #2c3e50; margin-bottom: 20px;">Reset Your Password</h2>

          <p style="font-size: 16px; color: #555;">
            Hello,
          </p>

          <p style="font-size: 16px; color: #555;">
            We received a request to reset your BioBrain account password.
            Click the button below to set a new password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}"
               style="background-color: #007bff; color: #ffffff; padding: 12px 25px;
                      text-decoration: none; border-radius: 5px; font-size: 16px;
                      display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #888;">
            This link will expire in 10 minutes for security reasons.
          </p>

          <p style="font-size: 14px; color: #888;">
            If you did not request a password reset, please ignore this email.
            Your account remains secure.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

          <p style="font-size: 13px; color: #aaa; text-align: center;">
            © ${new Date().getFullYear()} BioBrain. All rights reserved.
          </p>

        </div>
      </div>
      `
  });
}


async function sendForgotPasswordEmail(user, resetURL) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const response = await resend.emails.send({
      from: "onboarding@resend.dev", // change after domain verification
      //to: user.email,
      to: "biobrainquiz@gmail.com",
      subject: "Reset Your BioBrain Password",

      // ✅ ORIGINAL TEXT (unchanged)
      text: `
Reset Your BioBrain Password

We received a request to reset your password.

Click the link below:
${resetURL}

This link will expire in 10 minutes.

If you did not request this, please ignore this email.
      `,

      // ✅ ORIGINAL HTML (unchanged)
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

          <h2 style="color: #2c3e50; margin-bottom: 20px;">Reset Your Password</h2>

          <p style="font-size: 16px; color: #555;">
            Hello, <b>${user.username}</b>$
          </p>

          <p style="font-size: 16px; color: #555;">
            We received a request to reset your BioBrain account password.
            Click the button below to set a new password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}"
               style="background-color: #007bff; color: #ffffff; padding: 12px 25px;
                      text-decoration: none; border-radius: 5px; font-size: 16px;
                      display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #888;">
            This link will expire in 10 minutes for security reasons.
          </p>

          <p style="font-size: 14px; color: #888;">
            If you did not request a password reset, please ignore this email.
            Your account remains secure.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

          <p style="font-size: 13px; color: #aaa; text-align: center;">
            © ${new Date().getFullYear()} BioBrain. All rights reserved.
          </p>

        </div>
      </div>
      `
    });

    // 🔴 Handle Resend error
    if (response.error) {
      logger.error("Resend Error:", response.error);
      throw new Error(response.error.message || "Failed to send email");
    }

    logger.info("Email sent:", response.data);

    return response.data;

  } catch (error) {
    logger.error("Email sending failed:", error.message);
    throw error;
  }
}

module.exports = { sendExamReportEmail, sendForgotPasswordEmail };