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

export default async function handler(req: NextApiRequest, res: NextApiResponse<TSendEmailResult>) {
    const { senderEmail, subject, message }: TSendEmailInput = req.body;

    try {
        if (req.method === 'POST') {
            // Configuration du transporteur SMTP MailerSend
            const transporter = nodemailer.createTransport({
                host: 'smtp.mailersend.net',
                port: 587,
                secure: false, // true pour 465, false pour autres ports
                auth: {
                    user: process.env.MAILERSEND_SMTP_USERNAME ?? '',
                    pass: process.env.MAILERSEND_SMTP_PASSWORD ?? ''
                }
            });

            // Configuration de l'email
            const mailOptions = {
                from: {
                    name: 'Ma Liste de Cadeaux',
                    address: 'info@test-51ndgwv63xqlzqx8.mlsender.net'
                },
                to: 'malistedecadeaux.contact@gmail.com',
                replyTo: senderEmail,
                subject: `[Contact Form] ${subject}`,
                text: `Message from "${senderEmail}": ${message}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #444;">New Contact Form Submission</h2>
                        <p><strong>From:</strong> ${senderEmail}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                            <p>${message.replace(/\n/g, '<br/>')}</p>
                        </div>
                        <p style="color: #777; margin-top: 20px; font-size: 12px;">
                            This email was sent from the contact form on Ma Liste de Cadeaux website.
                        </p>
                    </div>`
            };

            // Envoi de l'email
            await transporter.sendMail(mailOptions);

            res.status(200).json({ success: true, error: '' });
        } else {
            res.status(400).json({
                success: false,
                error: 'Bad request'
            });
        }
    } catch (e) {
        console.error('Email sending error:', e);
        res.status(500).json({
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error occurred'
        });
    }
}
