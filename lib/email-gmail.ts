// lib/email-gmail.ts
import nodemailer from 'nodemailer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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
    console.log('📧 Sending email to:', to);

    const info = await transporter.sendMail({
      from: `"JACSICE" <${process.env.GMAIL_USER}>`,
      to: to, // Send directly to faculty email
      subject: `Welcome to JACSICE - Faculty Portal Access`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #4f46e5, #7c3aed); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 2px;">JACSICE</h1>
            <p style="color: #c4b5fd; margin: 5px 0 0;">Faculty Information System</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin: 0 0 20px;">Welcome, ${facultyName}! 👋</h2>
            
            <p style="color: #475569; line-height: 1.6;">You have been invited to join the JACSICE Faculty Portal. Below are your login credentials:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: bold; color: #4f46e5;">📋 Faculty Code:</span>
                <span style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${facultyCode}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: bold; color: #4f46e5;">👤 Username:</span>
                <span style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${username}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: bold; color: #4f46e5;">🔑 Password:</span>
                <span style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${password}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="font-weight: bold; color: #4f46e5;">✉️ Email:</span>
                <span style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${to}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${APP_URL}/login/faculty" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Login to Faculty Portal</a>
            </div>
            
            <div style="background: #fef3c7; padding: 12px; border-radius: 6px; border: 1px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 13px;">⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>JACSICE Faculty Information System</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      `,
    });

    console.log('✅ Email sent! Message ID:', info.messageId);
    return { success: true, id: info.messageId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    console.error('❌ Email error:', message);
    return { success: false, error: message };
  }
}