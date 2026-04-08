import "dotenv/config";

export const AUTH_SERVICE_URL   = process.env.AUTH_SERVICE_URL   || "http://localhost:4001";
export const USER_SERVICE_URL   = process.env.USER_SERVICE_URL   || "http://localhost:4002";
export const UPLOAD_SERVICE_URL = process.env.UPLOAD_SERVICE_URL || "http://localhost:4003";
export const VIDEO_SERVICE_URL  = process.env.VIDEO_SERVICE_URL  || "http://localhost:4004";
