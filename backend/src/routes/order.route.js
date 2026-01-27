import express from "express";
import db from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 
// UPLOAD CONFIG
// 
const uploadDir = "uploads/payments";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });


// 
// USER BUAT ORDER (LOGIN WAJIB)
//
router.post("/", verifyToken, async (req, res) => {
  try {
    const { product_id, qty } = req.body;
    const user_id = req.user.id;

    if (!product_id || !qty) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const [rows] = await db.query(
      "SELECT price, stock FROM products WHERE id=?",
      [product_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const product = rows[0];

    if (product.stock < qty) {
      return res.status(400).json({ message: "Stock tidak cukup" });
    }

    const total = product.price * qty;

    await db.query(
      "INSERT INTO orders (user_id, product_id, qty, total, status) VALUES (?,?,?,?,?)",
      [user_id, product_id, qty, total, "pending"]
    );

    await db.query(
      "UPDATE products SET stock = stock - ? WHERE id=?",
      [qty, product_id]
    );

    res.json({ message: "Order berhasil", total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// 
// USER RIWAYAT PESANAN
// 
router.get("/my", verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const [orders] = await db.query(
      `SELECT o.*, p.name AS product_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.user_id = ?
       ORDER BY o.id DESC`,
      [user_id]
    );

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// 
// UPLOAD BUKTI TRANSFER (USER)
//
router.post("/:id/upload", verifyToken, upload.single("payment"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File wajib diupload" });
    }

    await db.query(
      "UPDATE orders SET payment_proof=?, status='paid' WHERE id=?",
      [req.file.filename, req.params.id]
    );

    res.json({ message: "Bukti transfer berhasil" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload gagal" });
  }
});


//
// ADMIN LIHAT SEMUA ORDER
//
router.get("/", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses ditolak" });
  }

  const [orders] = await db.query(
    `SELECT o.*, u.name AS user_name, p.name AS product_name
     FROM orders o
     JOIN users u ON o.user_id = u.id
     JOIN products p ON o.product_id = p.id`
  );

  res.json(orders);
});


// 
// ADMIN APPROVE ORDER
// 
router.put("/:id/approve", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses ditolak" });
  }

  await db.query(
    "UPDATE orders SET status='approved' WHERE id=?",
    [req.params.id]
  );

  res.json({ message: "Order di-approve" });
});

export default router;
