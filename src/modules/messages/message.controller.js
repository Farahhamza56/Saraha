import { Router } from "express";
import * as MS from "./message.service.js"
import { authentication } from "../../common/middleware/authentication.js";
import { validation } from "../../common/middleware/validation.js";
import * as MV from "./message.validation.js";
import { multerlocal } from "../../common/middleware/multer.js";
import { Multer_Enum } from "../../common/enum/multer.enum.js";

const messageRouter = Router({strict:true,caseSensitive:true,mergeParams:true})

messageRouter.post("/",
    authentication,
    multerlocal({
        customPath: "messages",
        customTypes:Multer_Enum.images
    }).array("attachments", 3),
    validation(MV.createMessageSchema),
    MS.createMessage)

messageRouter.get("/", authentication, MS.getMessages)

messageRouter.get("/requests", authentication, MS.getRequests)

messageRouter.patch("/requests/:requestId", authentication, validation(MV.answerRequestSchema), MS.acceptOrRejectRequest)

messageRouter.get("/conversations", authentication, MS.getConversations)

messageRouter.get("/conversations/:conversationId/messages", authentication, validation(MV.conversationSchema), MS.getConversationMessages)

messageRouter.post("/conversations/:conversationId/messages", authentication, validation(MV.sendChatSchema), MS.sendConversationMessage)

messageRouter.get("/:id", authentication, validation(MV.messageIdSchema), MS.getMessageById)

messageRouter.post("/:id/request", authentication, validation(MV.messageIdSchema), MS.requestSenderIdentity)

export default messageRouter