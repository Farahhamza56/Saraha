import { hashSync } from "bcrypt"
import sendEmail, { generate_otp } from "../../common/service/sendEmail.js"
import { emailTemplate } from "../../common/utils/email.template.js"
import { eventEmitter } from "../../common/utils/events.js"
import { getValue, incr, setValue, ttl } from "../../DB/service/redis.service.js"
import { findOne } from "../../DB/service/db.service.js"
import userModel from "../../DB/models/user.model.js"

export const SendEmailOtp = async ({email,isConfirmed,subject="Confirm Email"}={}) => {
     const isBlocked_ttl = await ttl(`otp::block::${email}`)
    if (isBlocked_ttl > 0) throw new Error(`you blocked and you can resend otp after ${isBlocked_ttl} seconds`)
    if (isBlocked_ttl < 0) {
        if (await getValue(`otp::max::${email}`) >= 3) {
            await setValue({
                key: `otp::max::${email}`,
                value: 0,
                ttl: 60 * 5
            })
        }
    }
    const otpTTl = await ttl(`otp::${email}`)
    if (otpTTl > 0) throw new Error(`you can resend otp after ${otpTTl} seconds`)
    const max_otp = await getValue(`otp::max::${email}`)
    if (max_otp >= 3) {
        await setValue({
            key: `otp::block::${email}`,
            value: "1",
            ttl: 60 * 10
        })
        throw new Error(`you have exceeded the maximum umbers of tries`)
    }
    const user = await findOne({
        model: userModel,
        filter: {
            email,
            isConfirmed: { $exists: isConfirmed }
        }
    })
    if (!user) throw new Error("user not exist or already confirmed")
    const otp = await generate_otp()
    const otpHash = hashSync(otp, 12)
    await setValue({
        key: `otp::${email}`,
        value: otpHash,
        ttl: 60 * 20
    })
   eventEmitter.emit("confirm_email", async () => {
        await sendEmail({
            to: email,
            subject,
            html: emailTemplate(otp)
        })
    })
    const count = await incr(`otp::max::${email}`)
    if (count >= 3) {
        await setValue({
            key: `otp::block::${email}`,
            value: "1",
            ttl: 60 * 10
        })
    }

    }