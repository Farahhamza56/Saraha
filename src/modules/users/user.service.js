import { model } from "mongoose"
import * as dbService from "../../DB/dp.service.js"
import userModel from "../../DB/models/user.model.js"
import { decrypt, Encrypt } from "../../common/security/encrypt.js"
import {hashSync,compareSync} from "bcrypt"
import { Compare, Hash } from "../../common/security/hash.js"
import jwt from "jsonwebtoken"
import  {OAuth2Client} from "google-auth-library"
import { ProviderEnum } from "../../common/enum/user.enum.js"
import joi from "joi"
import multer from "multer"
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
   const user =await dbService.create({
    model:userModel,
    data:{fName,lName,email,password: await Hash(password),age,gender,phone:Encrypt(phone),profileImage:req.files.attachement[0].path,coverImages:paths}
   })

   return res.status(201).json({message:"Done",user})
   }

//______________________________________________________________________________________________________________________

   export const signUpWithGmail=async (req,res,next)=>{
    const{idToken} =req.body
     if(!idToken){
        throw new Error("idToken not exist");   
    }

  const decoded = await client.verifyIdToken({
      idToken,
      audience: "341814650695-mf3majokg5rcf1no06mmmejsnohb9eo8.apps.googleusercontent.com",
  });
  const { family_name, given_name, picture, email_verified, email } = decoded.getPayload();
  let user = await userModel.findOne({ email: email.toLowerCase() })
  if(user.provider==ProviderEnum.system){
    throw new Error("login with system only");
}
if (!user) {
    await userModel.create({
        fName: given_name,
        lName: family_name,
        email,
        profileImage: picture,
        isConfirmed: email_verified,
        provider: ProviderEnum.google
    })
}
 const access_token = jwt.sign({ id: user._id, email: user.email }, "farah562", {
    expiresIn: 60 * 5
})
const refresh_token = jwt.sign({ id: user._id, email: user.email }, "farahh562")
  
   return res.status(200).json({ access_token, refresh_token });
   
}
   
//____________________________________________________________________________________________________________

export const signin=  async (req,res,next)=>{
   
    const{email,password} =req.body 

    const user=await dbService.findOne({
        model:userModel,
        filter:{email:email.toLowerCase(),provider:ProviderEnum.system}
    })
   if(!user) {
   throw new Error("user not exist or you can login or signup");
   
   }

   if (! await Compare(password,user.password)){
    throw new Error("invalid password");
    
   }
   const access_token=jwt.sign({id:user._id,email: user.email},"farah562",{
    expiresIn:60*5,
    issuer:"http://localhost:3258"
   }
   )
   const refresh_token=jwt.sign({id:user._id,email:user.email},"farahh562")
   return res.status(201).json({message:"Done", tokens:{access_token,refresh_token}})

}
//________________________________________________________________________________________________________

export const getProfile=  async (req,res,next)=>{
   
   return res.status(201).json({message:"Done",user:req.user})

}