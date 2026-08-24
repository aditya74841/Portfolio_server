import nodemailer from "nodemailer";

/**
 * Create a Gmail transporter (reusable)
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });
};

/**
 * Send contact form message to your email
 * @param {{ name: string, email: string, description: string, ip: string }} options
 */
const sendContactEmail = async (options) => {
    const { name, email, description, ip } = options;

    const transporter = createTransporter();

    const mail = {
        from: {
            name: process.env.EMAIL_SENDER_NAME,
            address: process.env.MAILTRAP_SMTP_USER,
        },
        to: process.env.EMAIL_SENDER_LINK,
        subject: `New Contact Form Submission from ${name}`,
        text: `
Name: ${name}
Email: ${email}
Message: ${description}
IP Address: ${ip}
    `,
        html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${description}</p>
      <p><strong>IP Address:</strong> ${ip}</p>
    `,
    };

    try {
        await transporter.sendMail(mail);
        console.log("Contact email sent successfully!");
    } catch (error) {
        console.error(
            "Email service failed silently. Check Gmail SMTP credentials.",
            error
        );
    }
};

/**
 * Send password reset email
 * @param {string} toEmail - Recipient email
 * @param {string} resetUrl - Full password reset URL with token
 * @param {string} userName - User's name for personalization
 */
const sendResetPasswordEmail = async (toEmail, resetUrl, userName = "User") => {
    const transporter = createTransporter();

    const mail = {
        from: {
            name: process.env.EMAIL_SENDER_NAME || "Portfolio Dashboard",
            address: process.env.MAILTRAP_SMTP_USER,
        },
        to: toEmail,
        subject: "🔑 Password Reset Request",
        text: `
Hi ${userName},

You requested a password reset for your Portfolio Dashboard account.

Click the link below to reset your password (valid for 15 minutes):
${resetUrl}

If you didn't request this, please ignore this email.
        `,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">
    <tr>
      <td style="padding:40px 32px 24px;text-align:center;">
        <div style="width:56px;height:56px;margin:0 auto 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;line-height:56px;font-size:24px;">🔑</div>
        <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Password Reset</h1>
        <p style="color:#888;font-size:14px;margin:0;">Hi ${userName}, we received a reset request.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;">
        <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 24px;text-align:center;">
          Click the button below to set a new password.<br/>This link expires in <strong style="color:#fff;">15 minutes</strong>.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        <p style="color:#555;font-size:12px;margin:24px 0 0;text-align:center;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;border-top:1px solid #222;text-align:center;">
        <p style="color:#444;font-size:11px;margin:0;">Portfolio Dashboard • Secure Authentication</p>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
    };

    try {
        await transporter.sendMail(mail);
        console.log(`Reset password email sent to ${toEmail}`);
    } catch (error) {
        console.error("Failed to send reset password email:", error);
        throw new Error("Failed to send reset password email");
    }
};

export { sendContactEmail, sendResetPasswordEmail };
