import db from "../db.js";

export const insertUser = db.prepare(`
  INSERT INTO users (firstName, email, password_hash)
  VALUES (@name, @email, @password_hash)
`);

export const findUserByEmail = db.prepare(`
  SELECT * FROM users WHERE email = ?
`);

export const findUserById = db.prepare(`
  SELECT id, firstName as name, lastName, email, created_at
  FROM users
  WHERE id = ?
`);
