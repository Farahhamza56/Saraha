export const emailTemplate = (otp, minutes = 20) => {
    const otpBoxes = String(otp)
        .split("")
        .map(d => `<td style="padding:0 4px;">
            <div style="width:44px; height:54px; line-height:54px; background:#ffffff; border:2px solid #FF6B6B; border-radius:10px; font-size:28px; font-weight:bold; color:#FF6B6B; text-align:center;">${d}</div>
        </td>`)
        .join("")

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verification Code - Saraha</title>
</head>

<body style="margin:0; padding:0; background-color:#FFF5F0; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF5F0; padding:30px 10px;">
    <tr>
      <td align="center">

        <table width="560" cellpadding="0" cellspacing="0" style="max-width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#FF6B6B; background-image:linear-gradient(135deg, #FF6B6B, #FFA45B); padding:35px 20px; text-align:center; color:#ffffff;">
              <div style="font-size:42px;">🔐</div>
              <h2 style="margin:10px 0 0; font-size:26px;">Saraha App</h2>
              <p style="margin:6px 0 0; font-size:15px; opacity:0.9;">Verify your email</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:35px 30px; color:#2D2D2D; text-align:center;">
              <h3 style="margin:0 0 10px; font-size:22px;">Hello 👋</h3>
              <p style="margin:0 0 25px; font-size:15px; color:#666;">Enter this code to complete your verification</p>

              <!-- OTP Boxes -->
              <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                <tr>${otpBoxes}</tr>
              </table>

              <p style="margin:25px 0 0; font-size:13px; color:#999;">
                ⏱ This code expires in ${minutes} minutes
              </p>

              <p style="margin:30px 0 0; font-size:12px; color:#aaa;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa; padding:18px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee;">
              <p style="margin:0;">© 2026 Saraha App. All rights reserved.</p>
              <p style="margin:5px 0 0;">Please don't reply to this email.</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`
}