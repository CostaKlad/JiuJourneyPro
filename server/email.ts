import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  try {
    const resetUrl = `${process.env.APP_URL || window.location.origin}/auth?token=${resetToken}`;
    
    await mailService.send({
      to: email,
      from: 'noreply@ossryu.com', // Update this with your verified sender
      subject: 'Reset Your Ossryu Password',
      text: `Click the following link to reset your password: ${resetUrl}`,
      html: `
        <div>
          <h1>Reset Your Ossryu Password</h1>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
            Reset Password
          </a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}
