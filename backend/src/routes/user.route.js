import express from "express";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* GET ALL USERS (ADMIN) */
router.get("/", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses ditolak" });
  }

  const [rows] = await db.query(
    "SELECT id,name,email,role FROM users"
  );

  res.json(rows);
});

/* UPDATE ROLE */
router.put("/:id/role", verifyToken, async (req, res) => {

  if (req.user.is_super_admin !== 1) {
    return res.status(403).json({ message: "Hanya admin utama" });
  }

  const { role } = req.body;

  await db.query(
    "UPDATE users SET role=? WHERE id=?",
    [role, req.params.id]
  );

  res.json({ message: "Role berhasil diupdate" });
});


/* DELETE USER */
router.delete("/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses ditolak" });
  }

  await db.query(
    "DELETE FROM users WHERE id=?",
    [req.params.id]
  );

  res.json({ message: "User dihapus" });
});

export default router;
