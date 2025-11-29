// server/routes/userRoutes.js
import express from "express";
import db from "../db.js";
import { z } from "zod";
import { auth } from "../auth/authMiddleWare.js";
import { findUserById } from "../models/userModel.js";

const router = express.Router();

// GET /api/me (protected)
router.get("/me", auth, (req, res) => {
  const user = findUserById.get(req.user.sub);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ user });
});

const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

const searchUsers = db.prepare(`
  SELECT
    id,
    firstName as name,
    lastName as last_name,
    email
  FROM users
  WHERE firstName LIKE @like
    OR lastName LIKE @like
    OR email LIKE @like
  ORDER BY firstName
  LIMIT 10
`);

// GET /api/user/search?q= (protected)
router.get("/user/search", auth, (req, res) => {
  const parse = searchSchema.safeParse({ q: req.query.q });

  if (!parse.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: parse.error.flatten(),
    });
  }

  const q = parse.data.q.trim();
  const like = `%${q}%`;

  try {
    const rows = searchUsers.all({ like });
    const users = rows.map((u) => ({
      id: u.id,
      fullName: `${u.name}${u.last_name ? " " + u.last_name : ""}`.trim(),
      email: u.email,
    }));

    res.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

export default router;
