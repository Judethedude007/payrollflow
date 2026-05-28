// ============================================================
// Email Service — Nodemailer + Gmail SMTP
// ============================================================

import nodemailer from 'nodemailer';
import type { EmailOptions } from '@/types';

/**
 * Create Nodemailer transporter configured for Gmail SMTP
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send a salary slip email with PDF attachment
 */
export async function sendSalarySlipEmail(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">⚡ PayrollFlow</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0;">Salary Slip Notification</p>
          </div>
          
          <!-- Body -->
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #1e293b; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
              Dear <strong>${options.employeeName}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
              Please find attached your salary slip for <strong>${options.month} ${options.year}</strong>. 
              The document is password-protected for your security.
            </p>
            
            <!-- Info Box -->
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
              <p style="color: #0c4a6e; font-size: 13px; margin: 0; font-weight: 600;">🔒 Password Information</p>
              <p style="color: #0369a1; font-size: 13px; margin: 8px 0 0; line-height: 1.5;">
                Your PDF is protected with a password. Use your <strong>first name (lowercase) + birth year</strong> to open it.
                <br>Example: If your name is John and birth year is 1995, password is <strong>john1995</strong>
              </p>
            </div>
            
            <p style="color: #475569; font-size: 14px; margin: 0 0 8px; line-height: 1.6;">
              If you have any questions regarding your salary slip, please contact the HR department.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px 32px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              This is an automated email from PayrollFlow. Please do not reply.
            </p>
            <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0;">
              © ${new Date().getFullYear()} PayrollFlow. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"PayrollFlow" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: `Salary Slip - ${options.month} ${options.year}`,
      html: htmlBody,
      attachments: [
        {
          filename: options.pdfFilename,
          content: Buffer.from(options.pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
