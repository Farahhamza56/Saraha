import { EventEmitter } from "events";

export const eventEmitter = new EventEmitter();

eventEmitter.on("confirm_email", async (fn) => {
    try {
        await fn()
    } catch (error) {
        console.log(error, "\nsend email failed")
    }
})