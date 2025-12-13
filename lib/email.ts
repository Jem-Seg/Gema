import nodemailer from 'nodemailer';

// Configuration du transporteur email
export const createEmailTransporter = () => {
  // Vérifier si les variables d'environnement sont configurées
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.warn('⚠️ Configuration SMTP manquante - Les emails ne seront pas envoyés');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465, // true pour le port 465, false pour les autres
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
};

interface SendResetPasswordEmailParams {
  to: string;
  resetLink: string;
}

export const sendResetPasswordEmail = async ({ to, resetLink }: SendResetPasswordEmailParams) => {
  const transporter = createEmailTransporter();

  if (!transporter) {
    throw new Error('Configuration email non disponible');
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'GeStock';
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject: `Réinitialisation de votre mot de passe - ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #4f46e5;
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 0 0 15px;
              font-size: 16px;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              margin: 20px 0;
              background-color: #4f46e5;
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              text-align: center;
            }
            .button:hover {
              background-color: #4338ca;
            }
            .link-text {
              word-break: break-all;
              font-size: 14px;
              color: #666;
              background-color: #f8f8f8;
              padding: 12px;
              border-radius: 4px;
              margin: 15px 0;
            }
            .footer {
              background-color: #f8f8f8;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning p {
              margin: 0;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Réinitialisation de mot de passe</h1>
            </div>
            
            <div class="content">
              <p>Bonjour,</p>
              
              <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte <strong>${appName}</strong>.</p>
              
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
              </div>
              
              <p style="margin-top: 20px;">Ou copiez et collez ce lien dans votre navigateur :</p>
              <div class="link-text">${resetLink}</div>
              
              <div class="warning">
                <p><strong>⏰ Ce lien expire dans 1 heure.</strong></p>
              </div>
              
              <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel restera inchangé.</p>
            </div>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>&copy; ${new Date().getFullYear()} ${appName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte ${appName}.

Cliquez sur le lien suivant pour créer un nouveau mot de passe :
${resetLink}

⏰ Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.

Cet email a été envoyé automatiquement, merci de ne pas y répondre.
© ${new Date().getFullYear()} ${appName}. Tous droits réservés.
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
};
