import mongoose from "mongoose";

export default async function connectionDB() {
    await  mongoose.connect("mongodb://127.0.0.1:27017/saraha")
    .then(()=>{
        console.log("DB connected successfully");
    })
    .catch((error)=>{
        console.log(error,"\nDB connection failed");
        
    })
}