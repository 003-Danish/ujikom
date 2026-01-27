import express from "express";
import db from "../config/db.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

/* CREATE PRODUK (ADMIN) */
router.post("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, price, stock, description } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    await db.query(
      "INSERT INTO products (name, price, stock, description) VALUES (?,?,?,?)",
      [name, price, stock, description || null]
    );

    res.json({ message: "Produk berhasil ditambahkan" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET ALL PRODUK (PUBLIC) */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* GET PRODUK BY ID (PUBLIC) */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM products WHERE id=?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* UPDATE PRODUK (ADMIN) */
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, price, stock, description } = req.body;

    await db.query(
      "UPDATE products SET name=?, price=?, stock=?, description=? WHERE id=?",
      [name, price, stock, description || null, req.params.id]
    );

    res.json({ message: "Produk berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* DELETE PRODUK (ADMIN)*/
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ message: "Produk berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
