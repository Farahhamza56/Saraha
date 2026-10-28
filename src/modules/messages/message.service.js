import * as dbService from "../../DB/service/db.service.js"
import userModel from "../../DB/models/user.model.js"
import messageModel from "../../DB/models/message.model.js"
import requestModel from "../../DB/models/request.model.js"
import conversationModel from "../../DB/models/conversation.model.js"
import chatModel from "../../DB/models/chat.model.js"
import { RequestStatusEnum } from "../../common/enum/request.enum.js"


export const createMessage = async (req, res, next) => {

    const { content } = req.body
    const userId = req.body.userId || req.params.userId

    if (!userId) throw new Error("userId is required")
    if (!content && !req.files?.length) throw new Error("content is required")

    if (userId == req.user._id.toString()) throw new Error("you can't send a message to yourself")

    const userExist = await dbService.findById({
        model: userModel,
        id: userId
    })
    if (!userExist) throw new Error("user not exist");

    let urls = []
    if (req?.files?.length) {
        for (const file of req?.files) {
            urls.push(file.path)
        }
    }

    const [message] = await dbService.create({
        model: messageModel,
        data: {
            content,
            attachments: urls,
            userId,
            senderId: req.user._id
        }
    })


    return res.status(201).json({ message: "Done", data: message })

}
//__________________________________________________________________________________
export const getMessages = async (req, res, next) => {

    const messages = await dbService.find({
        model: messageModel,
        filter: {
            userId: req.user._id
        },
        options: {
            sort: { createdAt: -1 }
        }
    })

    return res.status(200).json({ message: "Done", messages })

}
//_____________________________________________________________________________________
export const getMessageById = async (req, res, next) => {

    const message = await dbService.findOne({
        model: messageModel,
        filter: {
            _id: req.params.id,
            userId: req.user._id
        }
    })
    if (!message) throw new Error("message not exist", { cause: 404 })

    let data = { message }

    const request = await dbService.findOne({
        model: requestModel,
        filter: {
            messageId: message._id,
            receiverId: req.user._id
        }
    })

    if (request) {
        data.request = { _id: request._id, status: request.status }

        if (request.status == RequestStatusEnum.accepted) {
            data.sender = await dbService.findById({
                model: userModel,
                id: message.senderId,
                options: "fName lName email profileImage"
            })
            data.conversation = await dbService.findOne({
                model: conversationModel,
                filter: { messageId: message._id }
            })
        }
    }

    return res.status(200).json({ message: "Done", data })
}
//_____________________________________________________________________________________
export const requestSenderIdentity = async (req, res, next) => {

    const message = await dbService.findOne({
        model: messageModel,
        filter: {
            _id: req.params.id,
            userId: req.user._id
        }
    })
    if (!message) throw new Error("message not exist", { cause: 404 })

    if (!message.senderId) throw new Error("this message has no sender to request")

    const requestExist = await dbService.findOne({
        model: requestModel,
        filter: {
            messageId: message._id,
            receiverId: req.user._id
        }
    })
    if (requestExist) throw new Error(`request already exist and it is ${requestExist.status}`, { cause: 409 })

    const [request] = await dbService.create({
        model: requestModel,
        data: {
            messageId: message._id,
            senderId: message.senderId,
            receiverId: req.user._id,
            status: RequestStatusEnum.pending
        }
    })

    return res.status(201).json({ message: "Done", request })
}
//_____________________________________________________________________________________
export const getRequests = async (req, res, next) => {

    const requests = await dbService.find({
        model: requestModel,
        filter: {
            senderId: req.user._id
        },
        options: {
            sort: { createdAt: -1 },
            populate: [
                { path: "messageId", select: "content attachments createdAt" },
                { path: "receiverId", select: "fName lName" }
            ]
        }
    })

    return res.status(200).json({ message: "Done", requests })
}
//_____________________________________________________________________________________
export const acceptOrRejectRequest = async (req, res, next) => {

    const { status } = req.body

    const request = await dbService.findOneAndUpdate({
        model: requestModel,
        filter: {
            _id: req.params.requestId,
            senderId: req.user._id,
            status: RequestStatusEnum.pending
        },
        update: { status }
    })
    if (!request) throw new Error("request not exist or already answered", { cause: 404 })

    let conversation
    if (status == RequestStatusEnum.accepted) {
        [conversation] = await dbService.create({
            model: conversationModel,
            data: {
                messageId: request.messageId,
                senderId: request.senderId,
                receiverId: request.receiverId
            }
        })
    }

    return res.status(200).json({ message: "Done", request, conversation })
}
//_____________________________________________________________________________________
export const getConversations = async (req, res, next) => {

    const conversations = await dbService.find({
        model: conversationModel,
        filter: {
            $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
        },
        options: {
            sort: { createdAt: -1 },
            populate: [
                { path: "senderId", select: "fName lName" },
                { path: "receiverId", select: "fName lName" }
            ]
        }
    })

    return res.status(200).json({ message: "Done", conversations })
}
//_____________________________________________________________________________________
export const sendConversationMessage = async (req, res, next) => {

    const { content } = req.body

    const conversation = await dbService.findById({
        model: conversationModel,
        id: req.params.conversationId
    })
    if (!conversation) throw new Error("conversation not exist", { cause: 404 })

    if (![conversation.senderId.toString(), conversation.receiverId.toString()].includes(req.user._id.toString())) {
        throw new Error("UnAuthorized", { cause: 403 })
    }

    const [chat] = await dbService.create({
        model: chatModel,
        data: {
            conversationId: conversation._id,
            senderId: req.user._id,
            content
        }
    })

    return res.status(201).json({ message: "Done", chat })
}
//_____________________________________________________________________________________
export const getConversationMessages = async (req, res, next) => {

    const conversation = await dbService.findById({
        model: conversationModel,
        id: req.params.conversationId
    })
    if (!conversation) throw new Error("conversation not exist", { cause: 404 })

    if (![conversation.senderId.toString(), conversation.receiverId.toString()].includes(req.user._id.toString())) {
        throw new Error("UnAuthorized", { cause: 403 })
    }

    const chats = await dbService.find({
        model: chatModel,
        filter: {
            conversationId: conversation._id
        },
        options: {
            sort: { createdAt: 1 }
        }
    })

    return res.status(200).json({ message: "Done", chats })
}