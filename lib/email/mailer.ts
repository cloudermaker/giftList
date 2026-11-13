import nodemailer from 'nodemailer';

// Jamais dérivé de l'en-tête Host (sinon un lien piégé pourrait pointer vers un autre domaine)
export const SITE_URL =
    process.env.SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://www.malistedecadeaux.fr' : 'http://localhost:3000');

const FROM = { name: 'Ma Liste de Cadeaux', address: 'contact@malistedecadeaux.fr' };

type TSmtpConfig = { host: string; user: string; pass: string };

// Brevo (SMTP_*) ; repli temporaire sur MailerSend tant que les variables Vercel ne sont pas migrées
const smtpConfig = (): TSmtpConfig | null => {
    const { SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, MAILERSEND_SMTP_USERNAME, MAILERSEND_SMTP_PASSWORD } = process.env;
    if (SMTP_USERNAME && SMTP_PASSWORD) {
        return { host: SMTP_HOST || 'smtp-relay.brevo.com', user: SMTP_USERNAME, pass: SMTP_PASSWORD };
    }
    if (MAILERSEND_SMTP_USERNAME && MAILERSEND_SMTP_PASSWORD) {
        return { host: 'smtp.mailersend.net', user: MAILERSEND_SMTP_USERNAME, pass: MAILERSEND_SMTP_PASSWORD };
    }
    return null;
};

export const sendMail = async ({
    to,
    subject,
    html,
    text,
    replyTo
}: {
    to: string;
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
}) => {
    const config = smtpConfig();
    // Sans identifiants SMTP (dev, e2e) ou avec EMAIL_DRY_RUN=true : l'email est seulement journalisé
    if (process.env.EMAIL_DRY_RUN === 'true' || !config) {
        console.info(`[mail dry-run] to=${to} subject="${subject}"\n${text}`);
        return;
    }
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: 587,
        secure: false,
        auth: { user: config.user, pass: config.pass }
    });
    await transporter.sendMail({ from: FROM, to, subject, html, text, replyTo });
};

// Gabarit commun : un message court + un bouton
export const actionEmail = ({
    intro,
    buttonLabel,
    url,
    outro
}: {
    intro: string;
    buttonLabel: string;
    url: string;
    outro: string;
}) => ({
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1f2937">
<p style="font-size:16px">${intro}</p>
<p style="text-align:center;margin:28px 0"><a href="${url}" style="background:#4a7c59;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">${buttonLabel}</a></p>
<p style="font-size:13px;color:#6b7280">${outro}</p>
<p style="font-size:12px;color:#9ca3af">Ma Liste de Cadeaux — malistedecadeaux.fr</p>
</div>`,
    text: `${intro}\n\n${buttonLabel} : ${url}\n\n${outro}`
});
