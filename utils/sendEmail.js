const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendResetEmail = async (email, username, token) => {
  const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "BioBrain Password Reset",
    html: `
      <div style="font-family: Arial; max-width:600px; margin:auto;">
        <h2 style="color:#1B5E20;">BioBrain Password Reset</h2>
        <p>Hello ${username},</p>
        <p>This link expires in ${process.env.EMAIL_EXPIRY_IN_MIN} minutes.</p>
        <a href="${resetLink}" 
           style="background:#1B5E20;color:white;padding:12px 18px;
                  text-decoration:none;border-radius:5px;">
          Reset Password
        </a>
      </div>
    `,
  });
};

module.exports = sendResetEmail;