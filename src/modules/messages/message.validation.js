import joi from "joi"
import { generalRules } from "../../common/utils/generalRules.js"
import { RequestStatusEnum } from "../../common/enum/request.enum.js"

export const createMessageSchema = {
    body: joi.object({
        content: joi.string(),
        userId: generalRules.id,
    }).required(),

    files: joi.array().items(generalRules.file)
}

export const messageIdSchema = {
    params: joi.object({
        id: generalRules.id.required(),
    }).unknown(true).required()
}

export const answerRequestSchema = {
    params: joi.object({
        requestId: generalRules.id.required(),
    }).unknown(true).required(),

    body: joi.object({
        status: joi.string().valid(RequestStatusEnum.accepted, RequestStatusEnum.rejected).required(),
    }).required()
}

export const conversationSchema = {
    params: joi.object({
        conversationId: generalRules.id.required(),
    }).unknown(true).required()
}

export const sendChatSchema = {
    params: joi.object({
        conversationId: generalRules.id.required(),
    }).unknown(true).required(),

    body: joi.object({
        content: joi.string().required(),
    }).required()
}