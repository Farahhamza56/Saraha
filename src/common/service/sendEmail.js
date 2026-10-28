import nodemailer from 'nodemailer';
import { randomInt } from 'crypto';
import { EMAIL, PASS } from '../../../config/config.service.js';

const sendEmail = async ({ to, subject,html,attachments }) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL,
            pass: PASS
        }
    })

    const info = await transporter.sendMail({
        from: `"farah" <${EMAIL}>`,
        to,
        subject,
        html,
        attachments: attachments || []
});

return info.accepted.length > 0 ? true : false

}
export const generate_otp =async () => {
    return randomInt(100000,1000000).toString()
}

export default sendEmail