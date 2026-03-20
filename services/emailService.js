const { Resend } = require("resend");
const fs = require("fs");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendReportEmail(useremail, username,filename, pdfpath) {

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
    console.error("Email sending failed:", error);
    throw error;
  }

}

module.exports = sendReportEmail;