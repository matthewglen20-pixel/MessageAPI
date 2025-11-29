import express from "express";
import { z } from "zod";
import db from "../db.js";
import { auth } from "../auth/authMiddleWare.js";

const router = express.Router();

// VALIDATION
const MessageSchema = z.object({
  recipientId: z.coerce.number().int(),
  body: z.string().min(1).max(2000),
});

const recipientExistsStmt = db.prepare("SELECT 1 FROM users WHERE id = ?");

// INSERT MESSAGE STATEMENT
const insertMessage = db.prepare(`
  INSERT INTO messages (sender_id, recipient_id, body)
  VALUES (@sender_id, @recipient_id, @body)
`);

// POST /api/messages
router.post("/messages", auth, (req, res) => {
  const senderId = req.user.sub;

  const parse = MessageSchema.safeParse({
    recipientId: req.body.recipientId,
    body: req.body.body,
  });

  if (!parse.success) {
    return res.status(400).json({
      error: "Invalid input",
      details: parse.error.flatten(),
    });
  }

  const { recipientId, body } = parse.data;

  // Check if recipient exists
  const recipientExists = recipientExistsStmt.get(recipientId);
  if (!recipientExists) {
    return res.status(404).json({ error: "Recipient not found" });
  }

  try {
    const info = insertMessage.run({
      sender_id: senderId,
      recipient_id: recipientId,
      body,
    });

    return res.status(201).json({
      id: info.lastInsertRowid,
      sender_id: senderId,
      recipient_id: recipientId,
      body,
    });
  } catch (error) {
    console.error("Error inserting message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

// GET THREADS
const getThreads = db.prepare(`
  WITH other AS (
    SELECT
     CASE
      WHEN m.sender_id = @me THEN m.recipient_id
      ELSE m.sender_id
    END AS other_user_id,
    m.created_at,
    m.body
  FROM messages m
  WHERE m.sender_id = @me OR recipient_id = @me
)
SELECT
  u.id AS user_id,
  u.firstName AS name,
  u.lastName AS last_name,
  u.email,
  MAX(o.created_at) AS lastMessageAt,
  (
  SELECT body
  FROM other o2
  WHERE o2.other_user_id = u.id
  ORDER BY o2.created_at DESC
  LIMIT 1
  ) AS lastBody
FROM other o
JOIN users u ON u.id = o.other_user_id
GROUP BY u.id, u.firstName, u.lastName, u.email
ORDER BY lastMessageAt DESC
`);

router.get("/messages/threads", auth, (req, res) => {
  const me = req.user.sub;

  try {
    const rows = getThreads.all({ me });

    const threads = rows.map((r) => ({
      userId: r.user_id,
      fullName: `${r.name}${r.last_name ? " " + r.last_name : ""}`.trim(),
      email: r.email,
      lastBody: r.lastBody,
      lastMessageAt: r.lastMessageAt,
    }));

    res.json({ threads });
  } catch (error) {
    console.error("Error fetching threads:", error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// GET CONVERSATION WITH USER
const getConversation = db.prepare(`
  SELECT
    id,
    sender_id,
    recipient_id,
    body,
    created_at
  FROM messages
  WHERE
    (sender_id = @me AND recipient_id = @them)
    OR
    (sender_id = @them AND recipient_id = @me)
  ORDER BY created_at ASC
  LIMIT 200
`);

router.get("/messages/with/:userId", auth, (req, res) => {
  const me = req.user.sub;
  const them = Number(req.params.userId);

  if (Number.isNaN(them)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const messages = getConversation.all({ me, them });
    res.json({ messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

export default router;
