import { createClient } from "redis"
import { REDIS_URL } from "../../config/config.service.js";

export const redis_client = createClient({
  url: REDIS_URL
});

redis_client.on("error", (error) => console.log("Redis error:", error.message));

export default async function connectionRedis() {
  try {
    await redis_client.connect();
    console.log("Redis Connected Successfully");
  } catch (error) {
    console.log("Redis Connected Failed");
  }
}