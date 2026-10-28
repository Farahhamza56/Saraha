
import jwt from "jsonwebtoken"
import { findOne } from "../../DB/service/db.service.js"
import userModel from "../../DB/models/user.model.js"
import { ttl } from "../../DB/service/redis.service.js";
import { ACCESS_TOKEN_SIGNATURE } from "../../../config/config.service.js";
export const authentication=async(req,res,next)=>{
     
    const{authorization} =req.headers; 
    if(!authorization){
      throw new Error("token not exist");
        
    }

    const decoded=jwt.verify(authorization,ACCESS_TOKEN_SIGNATURE)
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

   if (!user?.isConfirmed) throw new Error("user not confirmed yet")

  if (user?.changeCredentialAt?.getTime() > decoded?.iat * 1000) {
    throw new Error("you must login again", { cause: 401 })
}

if (await ttl(`revoke_token::${user._id}::${decoded.jti}`) > 0) {
  throw new Error("Invalid revoked token, you should login again")
}

   req.user=user
   req.decoded=decoded
   next()
}