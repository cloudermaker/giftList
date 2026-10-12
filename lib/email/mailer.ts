import nodemailer from 'nodemailer';

// Jamais dérivé de l'en-tête Host (sinon un lien piégé pourrait pointer vers un autre domaine)
export const SITE_URL =
    process.env.SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://www.malistedecadeaux.fr' : 'http://localhost:3000');

const FROM = { name: 'Ma Liste de Cadeaux', address: 'contact@malistedecadeaux.fr' };

// Sans identifiants SMTP (dev, e2e) ou avec EMAIL_DRY_RUN=true : l'email est seulement journalisé
const isDryRun = (): boolean =>
    process.env.EMAIL_DRY_RUN === 'true' || !process.env.MAILERSEND_SMTP_USERNAME || !process.env.MAILERSEND_SMTP_PASSWORD;

export const sendMail = async ({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) => {
    if (isDryRun()) {
        console.info(`[mail dry-run] to=${to} subject="${subject}"\n${text}`);
        return;
    }
    const transporter = nodemailer.createTransport({
        host: 'smtp.mailersend.net',
        port: 587,
        secure: false,
        auth: { user: process.env.MAILERSEND_SMTP_USERNAME, pass: process.env.MAILERSEND_SMTP_PASSWORD }
    });
    await transporter.sendMail({ from: FROM, to, subject, html, text });
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
