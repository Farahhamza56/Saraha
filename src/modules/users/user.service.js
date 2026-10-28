import { model } from "mongoose"
import * as dbService from "../../DB/service/db.service.js"
import userModel from "../../DB/models/user.model.js"
import { decrypt, Encrypt } from "../../common/security/encrypt.js"
import {hashSync,compareSync} from "bcrypt"
import { Compare, Hash } from "../../common/security/hash.js"
import jwt from "jsonwebtoken"
import  {OAuth2Client} from "google-auth-library"
import { ProviderEnum } from "../../common/enum/user.enum.js"
import joi from "joi"
import multer from "multer"
import { authorization } from "../../common/middleware/authorization.js"
import {randomUUID} from "node:crypto"
import { deleteKey, expire, getValue, incr, keys, setValue, ttl } from "../../DB/service/redis.service.js"
import sendEmail, { generate_otp } from "../../common/service/sendEmail.js"
import { eventEmitter } from "../../common/utils/events.js"
import { emailTemplate } from "../../common/utils/email.template.js"
import { SendEmailOtp } from "./user.helper.js"
import { ACCESS_TOKEN_SIGNATURE, GOOGLE_CLIENT_ID, REFRESH_TOKEN_SIGNATURE } from "../../../config/config.service.js"

const client = new OAuth2Client();

//____________________________________________________________________________________________________________________

export const signUp=async (req,res,next)=>{


    const{fName,lName,email,password,age,gender,phone} =req.body

   if( await userModel.findOne({email:email.toLowerCase()})) {
    throw new Error("email already exist");
    
   }
   const paths=[]
   for (const file of req.files.attachements) {
    paths.push(file.path)
    
   }
   
 const otp = await generate_otp()
const otpHash = hashSync(otp, 12)

await setValue({
    key: `otp::${email}`,
    value: otpHash,
    ttl: 60 * 2
})

await setValue({
    key: `otp::max::${email}`,
    value: 1,
    ttl: 60 * 5
})

eventEmitter.emit("confirm_email", async () => {
    await sendEmail({
        to: email,
        subject: "Confirm Email",
        html: emailTemplate(otp)
    })
})
   const user =await dbService.create({
    model:userModel,
    data:{fName,lName,email,password: await Hash(password),age,gender,phone:Encrypt(phone),profileImage:req.files.attachement[0].path,coverImages:paths}
   })

   return res.status(201).json({message:"Done",user})
   }
//______________________________________________________________________________________________________

   export const signUpWithGmail=async (req,res,next)=>{
    const{idToken} =req.body
     if(!idToken){
        throw new Error("idToken not exist");   
    }

  const decoded = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
  });
  const { family_name, given_name, picture, email_verified, email } = decoded.getPayload();
  let user = await userModel.findOne({ email: email.toLowerCase() })
  if(user && user.provider==ProviderEnum.system){
    throw new Error("login with system only");
}
if (!user) {
    [user] = await dbService.create({
        model: userModel,
        data: {
            fName: given_name,
            lName: family_name || given_name,
            email,
            profileImage: picture,
            isConfirmed: email_verified,
            provider: ProviderEnum.google
        }
    })
}
 const tokenId=randomUUID()
 const access_token = jwt.sign({ id: user._id, email: user.email }, ACCESS_TOKEN_SIGNATURE, {
    expiresIn: 60 * 5,
    jwtid:tokenId
})
const refresh_token = jwt.sign({ id: user._id, email: user.email }, REFRESH_TOKEN_SIGNATURE, {
    expiresIn:60*60,
    jwtid:tokenId
})
  
   return res.status(200).json({ access_token, refresh_token });
   
}
//______________________________________________________________________________________________________

export const signin=  async (req,res,next)=>{
   
    const{email,password} =req.body 

    const blockTtl = await ttl(`login::block::${email.toLowerCase()}`)
    if (blockTtl > 0) {
        throw new Error(`too many failed attempts, your account is banned and you can login again after ${blockTtl} seconds`, { cause: 429 })
    }

    const user=await dbService.findOne({
        model:userModel,
        filter:{email:email.toLowerCase(),isConfirmed: { $exists: true },provider:ProviderEnum.system}
    })
   if(!user) {
   throw new Error("user not exist or you can login or signup");
   
   }

   if (! await Compare(password,user.password)){
    const attempts = await incr(`login::attempts::${user.email}`)
    await expire({ key: `login::attempts::${user.email}`, ttl: 60 * 5 })
    if (attempts >= 5) {
        await setValue({
            key: `login::block::${user.email}`,
            value: "1",
            ttl: 60 * 5
        })
        await deleteKey(`login::attempts::${user.email}`)
        throw new Error("too many failed attempts, your account is banned for 5 minutes", { cause: 429 })
    }
    throw new Error("invalid password");
    
   }

   await deleteKey(`login::attempts::${user.email}`)

   if (user.twoStepVerification) {
    const otp = await generate_otp()
    const otpHash = hashSync(otp, 12)

    await setValue({
        key: `otp::login::${user.email}`,
        value: otpHash,
        ttl: 60 * 5
    })

    eventEmitter.emit("confirm_email", async () => {
        await sendEmail({
            to: user.email,
            subject: "Login Verification",
            html: emailTemplate(otp, 5)
        })
    })

    return res.status(200).json({message:"Done, verification code sent to your email"})
   }

   const tokenId=randomUUID()
   const access_token=jwt.sign({id:user._id,email: user.email},ACCESS_TOKEN_SIGNATURE,{
    expiresIn:60*5,
    jwtid:tokenId
   }
   )
   const refresh_token=jwt.sign({id:user._id,email:user.email},REFRESH_TOKEN_SIGNATURE,{
    expiresIn:60*60,
    jwtid:tokenId
   })
   return res.status(201).json({message:"Done", tokens:{access_token,refresh_token}})

}
//_____________________________________________________________________________________________________

export const confirmLogin=  async (req,res,next)=>{

    const{email,otp} =req.body

    const otpValue = await getValue(`otp::login::${email.toLowerCase()}`)
    if (!otpValue) {
        throw new Error("otp expire", { cause: 400 })
    }

    if (!compareSync(otp, otpValue)) {
        throw new Error("invalid otp", { cause: 400 })
    }

    const user=await dbService.findOne({
        model:userModel,
        filter:{email:email.toLowerCase(),isConfirmed: { $exists: true },provider:ProviderEnum.system}
    })
   if(!user) {
   throw new Error("user not exist or you can login or signup");
   }

   await deleteKey(`otp::login::${user.email}`)

   const tokenId=randomUUID()
   const access_token=jwt.sign({id:user._id,email: user.email},ACCESS_TOKEN_SIGNATURE,{
    expiresIn:60*5,
    jwtid:tokenId
   }
   )
   const refresh_token=jwt.sign({id:user._id,email:user.email},REFRESH_TOKEN_SIGNATURE,{
    expiresIn:60*60,
    jwtid:tokenId
   })
   return res.status(201).json({message:"Done", tokens:{access_token,refresh_token}})

}
//_____________________________________________________________________________________________________________________

export const getProfile=  async (req,res,next)=>{
   
   return res.status(201).json({message:"Done",user:req.user})

}
//______________________________________________________________________________________________________________________

export const refreshToken=  async (req,res,next)=>{
    const {authorization}=req.headers

      if(!authorization){
      throw new Error("token not exist");
        
    }

    const decoded=jwt.verify(authorization,REFRESH_TOKEN_SIGNATURE)
    if (!decoded?.id){
        throw new Error("invalid token");
        
    }

    const user=await dbService.findOne({
        model:userModel,
        filter:{_id: decoded.id}
    })
   if(!user) {
   throw new Error("user not exist or you can login or signup");
   }

     const access_token=jwt.sign({id:user._id,email: user.email},ACCESS_TOKEN_SIGNATURE,{
    expiresIn:60*5,
    jwtid:decoded.jti
   }
   )
   
   return res.status(201).json({message:"Done",access_token})

}
//_______________________________________________________________________________________________________________________

export const shareProfile=  async (req,res,next)=>{

    const {id}=req.params
    let user=await dbService.findById({
        model:userModel,
        id,
        options:{
            password:0
        }
    })
    if(!user){
        throw new Error("user not exist"); 
    }
    if (user.phone) user.phone=decrypt(user.phone)
   
   return res.status(201).json({message:"Done",user})

}
//________________________________________________________________________________________________________________________

export const updateProfile=async (req,res,next)=>{

    const{fName,lName,age,gender,phone} =req.body

   let updateQuery = {}

if (fName !== undefined) {
    updateQuery.fName = fName
}
if (lName !== undefined) {
    updateQuery.lName = lName
}
if (age !== undefined) {
    updateQuery.age = age
}
if (gender !== undefined) {
    updateQuery.gender = gender
}
if (phone !== undefined) {
    updateQuery.phone = Encrypt(phone)
}

let user=await dbService.findByIdAndUpdate({
    model: userModel,
    id: req.user._id,
    update: updateQuery,
})


   return res.status(200).json({message:"Done",user})
   }
//________________________________________________________________________________________________________________________

export const updatePassword=async (req,res,next)=>{

    const{oldPassword,newPassword} =req.body

 if(!await Compare(oldPassword,req.user.password)){
    throw new Error("Invalid Old Password");
    
 }

 req.user.password=await Hash(newPassword)
  req.user.changeCredentialAt = new Date()

 await req.user.save()


   return res.status(200).json({message:"Done",user:req.user})
   }
//_________________________________________________________________________________________________________________________

export const logout = async (req, res, next) => {
    const { flag } = req.query

    if (flag == "all") {
        req.user.changeCredentialAt = new Date()
        await req.user.save()
        await deleteKey(await keys(`revoke_token::${req.user._id}`))
    } else {

        await setValue({
            key:`revoke_token::${req.user._id}::${req.decoded.jti}`,
            value:`${req.decoded.jti}`,
            ttl:req.decoded.exp -Math.floor((Date.now()/1000))
        })
    }

    return res.status(200).json({ message: "Done" })
}
//__________________________________________________________________________________________________________________________

export const confirmEmail = async (req, res, next) => {

    const { email, otp } = req.body

    const otpValue = await getValue(`otp::${email}`)
    if (!otpValue) {
        throw new Error("otp expire", { cause: 400 })
    }

    if (!compareSync(otp, otpValue)) {
        throw new Error("invalid otp", { cause: 400 })
    }

    const user = await dbService.findOneAndUpdate({
        model: userModel,
        filter: {
            email,
           isConfirmed: { $exists: false }
        },
        update: {
            isConfirmed: true
        }
    })
    if (!user) {
        throw new Error("user not exist or already confirmed", { cause: 400 })
    }
    await deleteKey(`otp::${email}`)
    return res.status(200).json({ message: "Done", user })

}
//__________________________________________________________________________________________________________________________

export const reSendOtp = async (req, res, next) => {

    const { email } = req.body

    await SendEmailOtp({email, isConfirmed: false})
    return res.status(200).json({ message: "Done" })
}
//___________________________________________________________________________________________________________________________
export const forgetPassword = async (req, res, next) => {
    const { email } = req.body

    await SendEmailOtp({ email, isConfirmed: true })


    return res.status(200).json({ message: "Done" })

}
//______________________________________________________________________________________________________________________________

export const resetPassword = async (req, res, next) => {
    const { email, code, password } = req.body

    const otp = await getValue(`otp::${email}`)
    if (!otp) throw new Error(`token expire`)

    if (!compareSync(code, otp)) throw new Error("inValid otp")

    const user = await dbService.findOneAndUpdate({
        model:userModel,
        filter: {
            email,
            isConfirmed: { $exists: true }
        },
        update: {
            password: hashSync(password, 12),
            changeCredentialAt: new Date()
        }
    })
    if (!user) throw new Error("user not exist or already confirmed", { cause: 400 })

    await deleteKey(`otp::${email}`)

    return res.status(200).json({ message: "Done" })

}
//______________________________________________________________________________________________________________________________

export const enableTwoStep = async (req, res, next) => {

    if (req.user.twoStepVerification) {
        throw new Error("2-step-verification already enabled", { cause: 400 })
    }

    const otp = await generate_otp()
    const otpHash = hashSync(otp, 12)

    await setValue({
        key: `otp::2step::${req.user.email}`,
        value: otpHash,
        ttl: 60 * 5
    })

    eventEmitter.emit("confirm_email", async () => {
        await sendEmail({
            to: req.user.email,
            subject: "Enable 2-Step Verification",
            html: emailTemplate(otp, 5)
        })
    })

    return res.status(200).json({ message: "Done, verification code sent to your email" })
}
//______________________________________________________________________________________________________________________________

export const verifyEnableTwoStep = async (req, res, next) => {

    const { otp } = req.body

    const otpValue = await getValue(`otp::2step::${req.user.email}`)
    if (!otpValue) {
        throw new Error("otp expire", { cause: 400 })
    }

    if (!compareSync(otp, otpValue)) {
        throw new Error("invalid otp", { cause: 400 })
    }

    req.user.twoStepVerification = true
    await req.user.save()
    await deleteKey(`otp::2step::${req.user.email}`)

    return res.status(200).json({ message: "Done, 2-step-verification enabled" })
}
//______________________________________________________________________________________________________________________________

export const disableTwoStep = async (req, res, next) => {

    const { password } = req.body

    if (!req.user.twoStepVerification) {
        throw new Error("2-step-verification is not enabled", { cause: 400 })
    }

    if (!await Compare(password, req.user.password)) {
        throw new Error("invalid password", { cause: 400 })
    }

    req.user.twoStepVerification = false
    await req.user.save()

    return res.status(200).json({ message: "Done, 2-step-verification disabled" })
}