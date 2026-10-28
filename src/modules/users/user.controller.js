import { Router } from "express";
import * as US from "./user.service.js"
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { validation } from "../../common/middleware/validation.js";
import { refreshTokenSchema, signInSchema, signUpSchema,shareProfileSchema, updateProfileSchema, updatePasswordSchema, confirmEmailSchema, enableTwoStepSchema, disableTwoStepSchema, confirmLoginSchema, signUpWithGmailSchema, emailSchema, resetPasswordSchema, logoutSchema } from "./user.validation.js";
import messageRouter from "../messages/message.controller.js";
import multer from "multer";
import { multerlocal } from "../../common/middleware/multer.js";
const userRouter=Router({strict:true,caseSensitive:true})

userRouter.use("/:userId/messages", messageRouter)


userRouter.post("/signup",multerlocal({customPath:"users",customTypes: ['image/jpeg', 'image/png']}).fields([{name:"attachements",maxCount:3},{name:"attachement",maxCount:1},]),validation(signUpSchema),US.signUp)
userRouter.post("/signup/gmail",validation(signUpWithGmailSchema),US.signUpWithGmail)
userRouter.post("/signin",validation(signInSchema),US.signin)
userRouter.post("/confirm-login",validation(confirmLoginSchema),US.confirmLogin)
userRouter.post("/refresh-token",validation(refreshTokenSchema),US.refreshToken)
userRouter.get("/profile",authentication,authorization(Object.values(RoleEnum)),US.getProfile)
userRouter.get("/share-profile/:id",validation(shareProfileSchema),US.shareProfile)
userRouter.patch("/update-profile",validation(updateProfileSchema),authentication,US.updateProfile)
userRouter.patch("/update-password",validation(updatePasswordSchema),authentication,US.updatePassword)
userRouter.patch("/logout",validation(logoutSchema),authentication,US.logout)
userRouter.patch("/confirm-email",validation(confirmEmailSchema),US.confirmEmail)
userRouter.patch("/reSend-otp",validation(emailSchema), US.reSendOtp)
userRouter.patch("/forget-password",validation(emailSchema), US.forgetPassword)
userRouter.patch("/reset-password",validation(resetPasswordSchema), US.resetPassword)
userRouter.patch("/enable-2step",authentication,US.enableTwoStep)
userRouter.patch("/verify-enable-2step",validation(enableTwoStepSchema),authentication,US.verifyEnableTwoStep)
userRouter.patch("/disable-2step",validation(disableTwoStepSchema),authentication,US.disableTwoStep)

export default userRouter