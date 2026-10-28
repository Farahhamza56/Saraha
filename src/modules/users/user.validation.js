 import joi from "joi";
import { generalRules } from "../../common/utils/generalRules.js";
 export const signUpSchema={
    body:joi.object({
        fName: joi.string().required(),
        lName: joi.string().required(),
        email: generalRules.email.required(),
        password:generalRules.password.required(),
        age: joi.number().required(),
        gender: joi.string().valid('male','female').required(),
        phone: joi.string().required(),
    }).required(),

 files: joi.object({
    attachement: joi.array().items(generalRules.file.required()).required(),
    attachements: joi.array().items(generalRules.file.required()).required()
}).required()
 }

  export const signInSchema={
    body:joi.object({
        email: generalRules.email.required(),
        password:generalRules.password.required(),
    }).required()
}

export const confirmEmailSchema = {
    body: joi.object({
        email: joi.string().required(),
       otp: joi.string().pattern(/^[0-9]{6}$/).required()
    }).required()
}

export const refreshTokenSchema = {
    headers: generalRules.token.required()
}
export const shareProfileSchema = {
    params:joi.object({
        id: generalRules.id.required(),
    }).required()
}

 export const updateProfileSchema={
    body:joi.object({
        fName: joi.string(),
        lName: joi.string(),
        age: joi.number(),
        gender: joi.string().valid('male','female'),
        phone: joi.string(),
    }).required(),

 }

 export const updatePasswordSchema={
    body:joi.object({
        oldPassword: generalRules.password.required(),
        newPassword: generalRules.password.required(),
        cPassword: joi.string().valid(joi.ref("newPassword")).required(),
    }).required(),

 }

 export const enableTwoStepSchema={
    body:joi.object({
        otp: joi.string().pattern(/^[0-9]{6}$/).required()
    }).required()
 }

 export const disableTwoStepSchema={
    body:joi.object({
        password: generalRules.password.required()
    }).required()
 }

 export const confirmLoginSchema={
    body:joi.object({
        email: generalRules.email.required(),
        otp: joi.string().pattern(/^[0-9]{6}$/).required()
    }).required()
 }

 export const signUpWithGmailSchema={
    body:joi.object({
        idToken: joi.string().required()
    }).required()
 }

 export const emailSchema={
    body:joi.object({
        email: generalRules.email.required()
    }).required()
 }

 export const resetPasswordSchema={
    body:joi.object({
        email: generalRules.email.required(),
        code: joi.string().pattern(/^[0-9]{6}$/).required(),
        password: generalRules.password.required(),
        cPassword: joi.string().valid(joi.ref("password")).required(),
    }).required()
 }

 export const logoutSchema={
    query:joi.object({
        flag: joi.string().valid("all")
    }).required()
 }