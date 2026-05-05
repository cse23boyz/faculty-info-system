// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ⚠️ REPLACE THIS WITH YOUR EMAIL (the one you signed up to Resend with)
const ADMIN_EMAIL = 'cse23boyz@gmail.com'; // <-- CHANGE THIS

interface SendInviteEmailParams {
  to: string;
  facultyName: string;
  username: string;
  password: string;
  facultyCode: string;
}

export async function sendFacultyInviteEmail({
  to,
  facultyName,
  username,
  password,
  facultyCode,
}: SendInviteEmailParams) {
  try {
    // For testing: Send to admin email, but include faculty email in the body
    const isProduction = process.env.NODE_ENV === 'production';
    const sendTo = isProduction ? to : ADMIN_EMAIL; // Only send to yourself in dev

    const { data, error } = await resend.emails.send({
      from: 'JACSICE <onboarding@resend.dev>',
      to: [sendTo],
      subject: `Welcome to JACSICE - Faculty Portal Access for ${facultyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #2563eb, #4f46e5, #7c3aed); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
            .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .cred-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
            .cred-row:last-child { border-bottom: none; }
            .cred-label { font-weight: bold; color: #4f46e5; font-size: 14px; }
            .cred-value { color: #1f2937; font-family: 'Courier New', monospace; font-size: 14px; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin-top: 20px; font-size: 13px; color: #92400e; }
            .note { background: #e0e7ff; padding: 10px; border-radius: 6px; margin-top: 15px; font-size: 13px; color: #3730a3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 JACSICE</h1>
              <p>Faculty Information System</p>
            </div>
            <div class="content">
              <h2>Welcome, ${facultyName}! 👋</h2>
              <p>You have been invited to join the JACSICE Faculty Portal.</p>
              
              ${!isProduction ? `<div class="note">📌 DEV MODE: This email was sent to admin. Faculty email: ${to}</div>` : ''}
              
              <div class="credentials">
                <div class="cred-row">
                  <span class="cred-label">📋 Faculty Code:</span>
                  <span class="cred-value">${facultyCode}</span>
                </div>
                <div class="cred-row">
                  <span class="cred-label">👤 Username:</span>
                  <span class="cred-value">${username}</span>
                </div>
                <div class="cred-row">
                  <span class="cred-label">🔑 Password:</span>
                  <span class="cred-value">${password}</span>
                </div>
                <div class="cred-row">
                  <span class="cred-label">✉️ Email:</span>
                  <span class="cred-value">${to}</span>
                </div>
              </div>

              <a href="${APP_URL}/login/faculty" class="button">🔗 Login to Faculty Portal</a>
              
              <div class="warning">
                ⚠️ <strong>Important:</strong> Please change your password after your first login. Keep your credentials secure.
              </div>
            </div>
            <div class="footer">
              <p>JACSICE Faculty Information System</p>
              <p>This is an automated message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent! ID:', data?.id);
    return { success: true, id: data?.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Email error:', message);
    return { success: false, error: message };
  }
}