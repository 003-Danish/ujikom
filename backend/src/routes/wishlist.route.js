import express from "express";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();


router.get("/", verifyToken, async (req, res) => {
  const [rows] = await db.query(
    `SELECT w.*, p.name, p.price, p.image
     FROM wishlist w
     JOIN products p ON w.product_id = p.id
     WHERE w.user_id=?`,
    [req.user.id]
  );
  res.json(rows);
});


router.post("/", verifyToken, async (req, res) => {
  const { product_id } = req.body;

  await db.query(
    "INSERT INTO wishlist (user_id, product_id) VALUES (?,?)",
    [req.user.id, product_id]
  );

  res.json({ message: "Ditambahkan ke wishlist" });
});


router.delete("/:id", verifyToken, async (req, res) => {
  await db.query("DELETE FROM wishlist WHERE id=?", [req.params.id]);
  res.json({ message: "Dihapus" });
});

export default router;
