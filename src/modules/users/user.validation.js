 import joi from "joi";
 export const signUpSchema={
    body:joi.object({
        fName: joi.string().required(),
        lName: joi.string().required(),
        email: joi.string().required(),
        password:joi.string().required(),
        age: joi.number().required(),
        gender: joi.string().valid('male','female').required(),
        phone: joi.string().required(),
    }).required(),

    query:joi.object({
        flag:joi.boolean().required(),
    }).required()
 }

  export const signInSchema={
    body:joi.object({
        email: joi.string().required(),
        password:joi.string().required(),
    })
}