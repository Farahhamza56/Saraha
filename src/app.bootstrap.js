import express from 'express'
import connectionDB from './DB/connectionDB.js'
import userRouter from './modules/users/user.controller.js'
import cors from "cors"
const app=express()
const port=3258

const bootstrap=async()=>{
    app.use(cors({
        origin:"*"
    }))
await connectionDB()

app.use(express.json())

app.get('/',(req,res,next)=>res.status(200).json({message : "hello on my app"}))

app.use("/users",userRouter)

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