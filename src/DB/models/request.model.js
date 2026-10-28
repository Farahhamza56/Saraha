import mongoose from "mongoose";
import { RequestStatusEnum } from "../../common/enum/request.enum.js";

const requestSchema = new mongoose.Schema({
    messageId: {
        type: mongoose.Types.ObjectId,
        ref: "message",
        required: true
    },
    senderId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: Object.values(RequestStatusEnum),
        default: RequestStatusEnum.pending
    }

}, {
    timestamps: true,
    strictQuery: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

const requestModel = mongoose.models.request || mongoose.model("request", requestSchema)
export default requestModel