import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

export const ACCESS_TOKEN_TTL = "1h"; // 1 hour
export const REFRESH_TOKEN_TTL = "7d"; // 7 days

const JWT_SECRET = process.env.JWT_SECRET || "Derplings1!";

// Create short-lived access token
export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

// Create long-lived refresh token
export function createRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

// verify (throws on invalid)
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
