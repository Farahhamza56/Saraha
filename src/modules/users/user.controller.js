import { Router } from "express";
import * as US from "./user.service.js"
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { validation } from "../../common/middleware/validation.js";
import { signInSchema, signUpSchema } from "./user.validation.js";
import multer from "multer";
import { multerlocal } from "../../common/middleware/multer.js";
const userRouter=Router()


userRouter.post("/signup",multerlocal({customPath:"users",customTypes: ['image/jpeg', 'image/png']}).fields([{name:"attachements",max:3},{name:"attachement",max:1},]),validation(signUpSchema),US.signUp)
userRouter.post("/signup/gmail",US.signUpWithGmail)
userRouter.post("/signin",validation(signInSchema),US.signin)
userRouter.get("/profile",authentication,authorization(Object.values(RoleEnum)),US.getProfile)
// userRouter.delete("/",US.deleteUser)
// userRouter.get("/",US.getUser)

export default userRouter