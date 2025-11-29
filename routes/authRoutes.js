import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  insertUser,
  findUserByEmail,
  findUserById,
} from "../models/userModel.js";

import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from "../auth/tokens.js";

import { setRefreshCookie, clearRefreshCookie } from "../auth/cookies.js";

const router = Router();

// Zod schemas
const SignUpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

// POST /api/signup
router.post("/signup", (req, res) => {
  const parse = SignUpSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: "Invalid input", details: parse.error.flatten() });
  }

  const { name, email, password } = parse.data;

  const exists = findUserByEmail.get(email);
  if (exists) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const password_hash = bcrypt.hashSync(password, 12);

  try {
    const info = insertUser.run({ name, email, password_hash });
    const user = { id: info.lastInsertRowid, name, email };

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// POST /api/login
router.post("/login", (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: "Invalid input", details: parse.error.flatten() });
  }

  const { email, password } = parse.data;

  const row = findUserByEmail.get(email);
  if (!row) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = { id: row.id, name: row.firstName, email: row.email };

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
});

// POST /api/refresh
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: "Missing refresh token" });
  }

  try {
    const payload = verifyToken(refreshToken);

    const user = findUserById.get(payload.sub);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newAccessToken = createAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (e) {
    console.error(e);
    clearRefreshCookie(res);
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

export default router;
