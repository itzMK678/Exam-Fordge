import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

  if (gmailUser && gmailPass) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    return transporter;
  }

  return null;
}

/**
 * Send 6-Digit Password Reset Code to User's Gmail
 */
export async function sendPasswordResetEmail({ toEmail, code, userName }) {
  const mailTransporter = getTransporter();

  const recipientName = userName || "Student";
  const fromAddress = process.env.GMAIL_USER || process.env.EMAIL_FROM || '"ExamForge Support" <support@examforge.ai>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .logo { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 24px; display: inline-block; }
        .logo span { color: #2563eb; }
        .badge { display: inline-block; background: #eff6ff; color: #2563eb; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
        h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
        .code-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 18px 24px; text-align: center; margin: 24px 0; }
        .code-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 6px; }
        .code-val { font-size: 34px; font-weight: 900; letter-spacing: 0.25em; color: #2563eb; font-family: monospace; }
        .note { font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">Exam<span>Forge</span></div>
        <div class="badge">Password Recovery</div>
        <h2>Reset Your Password</h2>
        <p>Hello ${recipientName},</p>
        <p>We received a request to reset the password for your ExamForge account (${toEmail}). Enter the following 6-digit verification code to complete your recovery:</p>
        <div class="code-box">
          <div class="code-title">Your 6-Digit Verification Code</div>
          <div class="code-val">${code}</div>
        </div>
        <p style="font-size: 13px; color: #64748b;">This verification code will expire in <strong>15 minutes</strong>.</p>
        <div class="note">
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!mailTransporter) {
    console.log("=================================================");
    console.log(`[PASSWORD RESET CODE FOR ${toEmail}]: ${code}`);
    console.log(`[EXPIRES IN 15 MINUTES] (SMTP not configured in .env - to send real Gmail emails, set GMAIL_USER and GMAIL_APP_PASSWORD)`);
    console.log("=================================================");
    return {
      sent: true,
      mode: "dev_logged",
      code, // returned so dev UI can auto-suggest or test
    };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Your ExamForge Password Reset Code: ${code}`,
      html: htmlContent,
      text: `Your ExamForge verification code is: ${code}. This code expires in 15 minutes.`,
    });

    console.log(`[Email] Password reset code sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { sent: true, mode: "smtp", messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send email via SMTP:", error.message);
    console.log(`[FALLBACK CODE FOR ${toEmail}]: ${code}`);
    return {
      sent: true,
      mode: "dev_logged_fallback",
      code,
      error: error.message,
    };
  }
}

/**
 * Send Complaint Notification to Admin and Confirmation to Complainant
 */
export async function sendComplaintEmails({ userEmail, userName, message }) {
  if (!userEmail) {
    throw new Error("User email is required to send complaint confirmation.");
  }

  const mailTransporter = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || "mkzclipper@gmail.com";
  const fromAddress = process.env.GMAIL_USER || process.env.EMAIL_FROM || '"ExamForge Support" <support@examforge.ai>';
  const cleanUserName = userName || userEmail.split("@")[0] || "Student";
  const dateStr = new Date().toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "short" });

  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .badge { display: inline-block; background: #fee2e2; color: #dc2626; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
        h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
        .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0; font-size: 13px; line-height: 1.6; }
        .complaint-box { background: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #1f2937; }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">New Complaint</div>
        <h2>A User Submitted a Complaint</h2>
        <p>A new issue has been reported on the ExamForge main landing page.</p>
        
        <div class="meta-box">
          <div><strong>Student Name:</strong> ${cleanUserName}</div>
          <div><strong>Student Email:</strong> <a href="mailto:${userEmail}" style="color: #2563eb;">${userEmail}</a></div>
          <div><strong>Received At:</strong> ${dateStr} UTC</div>
        </div>

        <div style="font-weight: 700; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Complaint Message:</div>
        <div class="complaint-box">${message}</div>

        <div class="footer">
          To reply to the student, simply reply directly to this email (<a href="mailto:${userEmail}">${userEmail}</a>).
        </div>
      </div>
    </body>
    </html>
  `;

  const userHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .badge { display: inline-block; background: #eff6ff; color: #2563eb; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
        h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
        .complaint-copy { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #1f2937; }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">Support Ticket Received</div>
        <h2>We've Received Your Complaint</h2>
        <p>Hello ${cleanUserName},</p>
        <p>Thank you for bringing this to our attention. Our ExamForge support and development team has received your report and is actively looking into it.</p>
        
        <div style="font-weight: 700; font-size: 12px; color: #64748b; text-transform: uppercase;">Copy of your message:</div>
        <div class="complaint-copy">${message}</div>

        <p>We take all user feedback and issues seriously. If we need any additional details, our team will reach out directly to this email address.</p>

        <div class="footer">
          Best regards,<br>
          <strong>The ExamForge Team</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!mailTransporter) {
    console.log("=================================================");
    console.log(`[SIMULATED COMPLAINT EMAIL TO ADMIN (${adminEmail})]:`);
    console.log(`From: ${cleanUserName} <${userEmail}>`);
    console.log(`Message: ${message}`);
    console.log(`[SIMULATED COMPLAINT CONFIRMATION TO USER (${userEmail})]`);
    console.log("=================================================");
    return { sent: true, mode: "dev_logged" };
  }

  try {
    // 1. Send complaint alert to Admin
    const adminMail = mailTransporter.sendMail({
      from: fromAddress,
      to: adminEmail,
      replyTo: userEmail,
      subject: `🚨 [ExamForge Complaint] New issue from ${cleanUserName} (${userEmail})`,
      html: adminHtml,
      text: `New complaint from ${cleanUserName} (${userEmail}):\n\n${message}`,
    });

    // 2. Send confirmation receipt to Complainant
    const userMail = mailTransporter.sendMail({
      from: fromAddress,
      to: userEmail,
      subject: "We received your complaint — ExamForge Support",
      html: userHtml,
      text: `Hello ${cleanUserName},\n\nWe have received your complaint:\n\n"${message}"\n\nOur team is reviewing it.`,
    });

    await Promise.allSettled([adminMail, userMail]);
    console.log(`[Email] Complaint emails successfully dispatched to admin (${adminEmail}) and user (${userEmail})`);
    return { sent: true, mode: "smtp" };
  } catch (error) {
    console.error("[Email] Failed to send complaint email via SMTP:", error.message);
    return { sent: false, error: error.message };
  }
}
