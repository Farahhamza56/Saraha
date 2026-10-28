import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";

export default async function connectionDB() {
    await  mongoose.connect(DB_URI)
    .then(()=>{
        console.log("DB connected successfully");
    })
    .catch((error)=>{
        console.log(error,"\nDB connection failed");
        
    })
}