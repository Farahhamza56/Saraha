
import jwt from "jsonwebtoken"
import { findOne } from "../../DB/dp.service.js"
import userModel from "../../DB/models/user.model.js"
export const authentication=async(req,res,next)=>{
     
    const{authorization} =req.headers; 
    if(!authorization){
      throw new Error("token not exist");
        
    }

    const decoded=jwt.verify(authorization,"farah562")
    if (!decoded?.id){
        throw new Error("invalid token");
        
    }

    const user=await findOne({
        model:userModel,
        filter:{_id: decoded.id}
    })
   if(!user) {
   throw new Error("user not exist or you can login or signup");
   }

   req.user=user
   next()
}