import fs from "node:fs"
import {resolve} from "node:path"
import multer from "multer"
import {randomUUID} from "node:crypto"

export const multerlocal =({customPath="General",customTypes=[]})=>{

   const fullPath = `uploads/${customPath}`
if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath,{recursive:true})
}


    const storage=multer.diskStorage({
        destination:(req,file,cb)=>{
            cb(null,fullPath)
        },
        filename:(req, file, cb)=> {
            cb(null,randomUUID()+"___"+ file.originalname)
        }
    })

 function fileFilter(req, file, cb) {
    console.log({ file });

    if (!customTypes.includes(file.mimetype)) {
        cb(new Error('Invalid file!'))
    } else {
        cb(null, true)
    }
}


    const upload =multer({storage,fileFilter})
    return upload
}