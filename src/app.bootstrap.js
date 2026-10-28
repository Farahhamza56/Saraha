import express from 'express'
import connectionDB from './DB/connectionDB.js'
import userRouter from './modules/users/user.controller.js'
import cors from "cors"
import connectionRedis from './DB/connection.redis.js'
import sendEmail from './common/service/sendEmail.js'
import messageRouter from './modules/messages/message.controller.js'
import { ALLOW_ORIGINS, PORT } from "../config/config.service.js"
import rateLimit from "express-rate-limit"
import helmet from 'helmet'
const app=express()
const port = PORT;

const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    skipSuccessfulRequests:true
})

const allowOrigins = [
    "http://localhost:4000",
    "http://localhost:5000"
]

const bootstrap=async()=>{
app.set("case sensitive routing",true)
app.set("strict routing",true)


  app.use(cors({
    origin: function (origin, callback) {
       if ([...ALLOW_ORIGINS, undefined].includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("not allowed by origin"))
        }
    }
}))
await connectionDB()
await connectionRedis()

app.use(limiter)
app.use(helmet())
app.use(express.json())

app.get('/',(req,res,next)=>res.status(200).json({message : "hello on my app"}))

app.use("/users",userRouter)
app.use("/messages",messageRouter)


app.use("{/*demo}",(req,res,next)=>{
   throw new Error("Not found",{cause:404});
   
})



app.use((err, req, res, next) => {
 console.log(err);
  res.status(err.cause || 500).json({error:err.message , stack:err.stack});
});
app.listen(port,()=>console.log(`app listening on port ${port}`)
)
}

export default bootstrap