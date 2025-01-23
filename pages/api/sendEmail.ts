import type { NextApiRequest, NextApiResponse } from 'next';
import { MailService } from '@sendgrid/mail';

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
                from: 'malistedecadeaux.contact@gmail.com',
                subject: subject,
                message: subject,
                html: `
                        <div>
                        <h1>Message from "${senderEmail}"</h1>
                        <i>${message.replaceAll('\n', '<br/>')}</i>
                        </div>`
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
