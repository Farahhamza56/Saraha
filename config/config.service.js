import { config } from "dotenv";
import { resolve } from "node:path"

const NODE_ENV = process.env.NODE_ENV 

const envPath = {
    development: ".env.development",
    production: ".env.production",
} 

config({ path: resolve(`config/${envPath[NODE_ENV]}`) })

export const PORT = process.env.PORT
export const DB_URI = process.env.DB_URI
export const ALLOW_ORIGINS = process.env.ALLOW_ORIGINS.split(",") || []
export const REDIS_URL = process.env.REDIS_URL
export const ACCESS_TOKEN_SIGNATURE = process.env.ACCESS_TOKEN_SIGNATURE
export const REFRESH_TOKEN_SIGNATURE = process.env.REFRESH_TOKEN_SIGNATURE
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
export const EMAIL = process.env.EMAIL
export const PASS = process.env.PASS
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID