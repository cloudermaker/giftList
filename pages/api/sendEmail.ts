import type { NextApiRequest, NextApiResponse } from 'next';
import { MailService } from '@sendgrid/mail';
import { text } from 'stream/consumers';

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
            const mailService = new MailService();

            mailService.setApiKey(process.env.SENDGRID_API_KEY ?? '');

            const emailToSend = {
                to: 'malistedecadeaux.contact@gmail.com',
                from: {
                    email: 'malistedecadeaux.contact@gmail.com',
                    name: 'Ma Liste de Cadeaux'
                },
                subject: `[Contact Form] ${subject}`,
                text: `Message from "${senderEmail}": ${message}`,
                replyTo: senderEmail,
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
                    </div>`,
                trackingSettings: {
                    clickTracking: {
                        enable: false
                    },
                    openTracking: {
                        enable: true
                    }
                }
            };

            await mailService.send(emailToSend, false);

            res.status(200).json({ success: true, error: '' });
        } else {
            res.status(400).json({
                success: false,
                error: 'Bad request'
            });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: e as string });
    }
}
