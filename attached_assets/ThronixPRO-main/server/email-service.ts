import { Resend } from 'resend';

let resend: Resend | null = null;

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not found. Email sending will be disabled.');
} else {
  console.log('Resend API key found. Email service enabled.');
  resend = new Resend(process.env.RESEND_API_KEY);
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!process.env.RESEND_API_KEY;
  }

  async sendVerificationEmail(
    email: string, 
    name: string, 
    verificationToken: string,
    baseUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('Resend not configured. Verification link:', 
        `${baseUrl}/api/auth/verify-email?token=${verificationToken}`);
      return false;
    }

    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    
    const emailParams: EmailParams = {
      to: email,
      subject: 'Verify Your ThronixPRO Trading Account',
      html: this.getVerificationEmailHTML(name, verificationUrl, email),
      text: this.getVerificationEmailText(name, verificationUrl)
    };

    return await this.sendEmail(emailParams);
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('SendGrid not configured. Password reset link:', resetUrl);
      return false;
    }

    const emailParams: EmailParams = {
      to: email,
      subject: 'Reset Your ThronixPRO Trading Password',
      html: this.getPasswordResetEmailHTML(name, resetUrl, email),
      text: this.getPasswordResetEmailText(name, resetUrl)
    };

    return await this.sendEmail(emailParams);
  }

  private async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.isConfigured || !resend) {
      console.log('Resend not configured. Email content logged for manual review.');
      return false;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'support@thronixpro.co.uk',
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text || '',
      });

      if (error) {
        console.error('Resend email error:', error);
        console.log('Error details:', JSON.stringify(error, null, 2));
        console.log('Failed to send email to:', params.to);
        console.log('Subject:', params.subject);
        return false;
      }

      console.log(`Email sent successfully to ${params.to}`, data);
      return true;
    } catch (error: any) {
      console.error('Resend email error:', error.message);
      console.log('Failed to send email to:', params.to);
      console.log('Subject:', params.subject);
      return false;
    }
  }

  private getVerificationEmailHTML(name: string, verificationUrl: string, email?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your ThronixPRO Account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #1a1b23;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #2d1b69; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #fff; font-size: 28px; margin: 0;">ThronixPRO</h1>
              <p style="color: #a855f7; font-size: 16px; margin: 10px 0 0 0;">Professional Trading Platform</p>
            </div>
            
            <div style="background-color: #1a1b23; border-radius: 10px; padding: 30px; margin: 20px 0;">
              <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">Welcome to ThronixPRO, ${name}!</h2>
              
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for registering with ThronixPRO, the professional cryptocurrency trading platform. 
                To start trading with real funds and access all features, please verify your email address.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); 
                          color: white; 
                          text-decoration: none; 
                          padding: 15px 30px; 
                          border-radius: 8px; 
                          font-size: 16px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #a855f7; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <div style="border-top: 1px solid #374151; margin: 30px 0 20px 0; padding-top: 20px;">
                <p style="color: #ef4444; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>⚠️ Important Legal Disclaimer:</strong><br>
                  ThronixPRO is not liable for any financial losses. Cryptocurrency trading involves substantial risk. 
                  You are trading with real money and actual funds. Only trade what you can afford to lose.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
              <p style="margin: 0;">© 2025 ThronixPRO Trading Platform. All rights reserved.</p>
              <p style="margin: 10px 0 0 0;">This email was sent to ${email} regarding your ThronixPRO account.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getVerificationEmailText(name: string, verificationUrl: string): string {
    return `
Welcome to ThronixPRO, ${name}!

Thank you for registering with ThronixPRO, the professional cryptocurrency trading platform.

To start trading with real funds and access all features, please verify your email address by clicking the link below:

${verificationUrl}

IMPORTANT LEGAL DISCLAIMER:
ThronixPRO is not liable for any financial losses. Cryptocurrency trading involves substantial risk. You are trading with real money and actual funds. Only trade what you can afford to lose.

© 2025 ThronixPRO Trading Platform. All rights reserved.
    `;
  }

  private getPasswordResetEmailHTML(name: string, resetUrl: string, email?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your ThronixPRO Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #1a1b23;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #2d1b69; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #fff; font-size: 28px; margin: 0;">ThronixPRO</h1>
              <p style="color: #a855f7; font-size: 16px; margin: 10px 0 0 0;">Professional Trading Platform</p>
            </div>
            
            <div style="background-color: #1a1b23; border-radius: 10px; padding: 30px; margin: 20px 0;">
              <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">Reset Your Password</h2>
              
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello ${name}, we received a request to reset the password for your ThronixPRO trading account.
                Click the button below to set a new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); 
                          color: white; 
                          text-decoration: none; 
                          padding: 15px 30px; 
                          border-radius: 8px; 
                          font-size: 16px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #a855f7; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <div style="border-top: 1px solid #374151; margin: 30px 0 20px 0; padding-top: 20px;">
                <p style="color: #f59e0b; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>🔒 Security Notice:</strong><br>
                  This password reset link will expire in 1 hour for security. If you didn't request this reset, you can safely ignore this email.
                  Your account remains secure.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
              <p style="margin: 0;">© 2025 ThronixPRO Trading Platform. All rights reserved.</p>
              <p style="margin: 10px 0 0 0;">This email was sent to ${email} regarding your password reset request.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getPasswordResetEmailText(name: string, resetUrl: string): string {
    return `
Reset Your ThronixPRO Password

Hello ${name},

We received a request to reset the password for your ThronixPRO trading account.

To reset your password, click the link below:

${resetUrl}

SECURITY NOTICE:
This password reset link will expire in 1 hour for security. If you didn't request this reset, you can safely ignore this email. Your account remains secure.

© 2025 ThronixPRO Trading Platform. All rights reserved.
    `;
  }
}

export const emailService = new EmailService();