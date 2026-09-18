import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export type TSendEmailResult = {
    success: boolean;
    error: string;
};

type TSendEmailInput = {
    senderEmail: string;
    subject: string;
    message: string;
};

const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limit simple en mémoire (par instance lambda) : 5 envois / heure / IP
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const sendsByIp = new Map<string, number[]>();
const isRateLimited = (ip: string): boolean => {
    const now = Date.now();
    const recent = (sendsByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_LIMIT) return true;
    recent.push(now);
    sendsByIp.set(ip, recent);
    return false;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TSendEmailResult>) {
    const { senderEmail: rawEmail, subject: rawSubject, message: rawMessage }: TSendEmailInput = req.body;

    try {
        if (req.method === 'POST') {
            if (typeof rawEmail !== 'string' || !EMAIL_REGEX.test(rawEmail) || rawEmail.length > 254) {
                return res.status(400).json({ success: false, error: 'Adresse email invalide.' });
            }
            if (typeof rawSubject !== 'string' || !rawSubject.trim() || rawSubject.length > 200) {
                return res.status(400).json({ success: false, error: 'Sujet invalide (200 caractères max).' });
            }
            if (typeof rawMessage !== 'string' || !rawMessage.trim() || rawMessage.length > 2000) {
                return res.status(400).json({ success: false, error: 'Message invalide (2000 caractères max).' });
            }

            const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
            if (isRateLimited(ip)) {
                return res.status(429).json({ success: false, error: 'Trop de messages envoyés. Réessayez plus tard.' });
            }

            // Valeurs échappées pour l'interpolation HTML
            const senderEmail = escapeHtml(rawEmail);
            const subject = escapeHtml(rawSubject.trim());
            const message = escapeHtml(rawMessage.trim());

            // Configuration du transporteur SMTP MailerSend
            const transporter = nodemailer.createTransport({
                host: 'smtp.mailersend.net',
                port: 587,
                secure: false, // true pour 465, false pour autres ports
                auth: {
                    user: process.env.MAILERSEND_SMTP_USERNAME || '',
                    pass: process.env.MAILERSEND_SMTP_PASSWORD || ''
                }
            });

            // Configuration de l'email avec timestamp pour éviter le groupement
            const timestamp = new Date().toISOString();
            const uniqueId = Math.random().toString(36).substring(7);

            const mailOptions = {
                from: {
                    name: 'Ma Liste de Cadeaux',
                    address: 'contact@malistedecadeaux.fr'
                },
                to: 'contact@malistedecadeaux.fr',
                replyTo: rawEmail,
                subject: `${rawSubject.trim()} [#${uniqueId}]`, // Sujet unique avec ID aléatoire
                text: `Nouveau message reçu via le formulaire de contact\n\nDe: ${rawEmail}\nSujet: ${rawSubject.trim()}\nDate: ${new Date().toLocaleString('fr-FR')}\n\nMessage:\n${rawMessage.trim()}`,
                html: `
                    <!DOCTYPE html>
                    <html lang="fr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td align="center" style="padding: 40px 0;">
                                    <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <!-- Header -->
                                        <tr>
                                            <td style="padding: 30px 30px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                                    📬 Nouveau message reçu
                                                </h1>
                                                <p style="margin: 8px 0 0; color: #ffffff; opacity: 0.9; font-size: 14px;">
                                                    Formulaire de contact - Ma Liste de Cadeaux
                                                </p>
                                            </td>
                                        </tr>
                                        
                                        <!-- Content -->
                                        <tr>
                                            <td style="padding: 30px;">
                                                <!-- Sender Info -->
                                                <div style="margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                                                    <p style="margin: 0 0 8px; color: #666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Expéditeur
                                                    </p>
                                                    <p style="margin: 0; color: #333; font-size: 16px;">
                                                        <a href="mailto:${senderEmail}" style="color: #667eea; text-decoration: none;">
                                                            ${senderEmail}
                                                        </a>
                                                    </p>
                                                </div>

                                                <!-- Subject -->
                                                <div style="margin-bottom: 25px;">
                                                    <p style="margin: 0 0 8px; color: #666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Sujet
                                                    </p>
                                                    <p style="margin: 0; color: #333; font-size: 18px; font-weight: 500;">
                                                        ${subject}
                                                    </p>
                                                </div>

                                                <!-- Date -->
                                                <div style="margin-bottom: 25px;">
                                                    <p style="margin: 0 0 8px; color: #666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Date de réception
                                                    </p>
                                                    <p style="margin: 0; color: #666; font-size: 14px;">
                                                        ${new Date().toLocaleString('fr-FR', {
                                                            dateStyle: 'full',
                                                            timeStyle: 'short'
                                                        })}
                                                    </p>
                                                </div>

                                                <!-- Message -->
                                                <div style="margin-bottom: 20px;">
                                                    <p style="margin: 0 0 12px; color: #666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Message
                                                    </p>
                                                    <div style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
                                                        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                                                    </div>
                                                </div>

                                                <!-- Reply Button -->
                                                <div style="margin-top: 30px; text-align: center;">
                                                    <a href="mailto:${senderEmail}?subject=Re: ${encodeURIComponent(subject)}" 
                                                       style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                                                        Répondre à ${senderEmail}
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                        
                                        <!-- Footer -->
                                        <tr>
                                            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                                                <p style="margin: 0; color: #999; font-size: 12px; text-align: center; line-height: 1.5;">
                                                    Ce message a été envoyé via le formulaire de contact du site<br>
                                                    <strong>Ma Liste de Cadeaux</strong> - malistedecadeaux.fr<br>
                                                    <span style="color: #ccc;">Référence: #${uniqueId} - ${timestamp}</span>
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>`
            };

            // Envoi de l'email
            await transporter.sendMail(mailOptions);

            res.status(200).json({ success: true, error: '' });
        } else {
            res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }
    } catch (e) {
        console.error('Email sending error:', e);
        res.status(500).json({
            success: false,
            error: "L'envoi a échoué. Réessayez plus tard."
        });
    }
}
