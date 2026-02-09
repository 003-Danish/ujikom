import express from "express";
import db from "../config/db.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* 
   SETUP UPLOAD IMAGE
 */

const uploadDir = "uploads/products";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  }
});

const upload = multer({ storage });

/* 
   CREATE PRODUK
 */
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, stock, description } = req.body;
      const image = req.file ? req.file.filename : null;

      if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ message: "Data tidak lengkap" });
      }

      await db.query(
        "INSERT INTO products (name, price, stock, description, image) VALUES (?,?,?,?,?)",
        [name, price, stock, description || null, image]
      );

      res.json({ message: "Produk berhasil ditambahkan" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* 
   GET ALL
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* 
   STOCK STATS
 */
router.get("/stock/stats", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses ditolak" });
  }

  const [total] = await db.query(
    "SELECT SUM(stock) as total_stock FROM products"
  );

  const [low] = await db.query(
    "SELECT id,name,stock FROM products WHERE stock < 10"
  );

  res.json({
    total_stock: total[0].total_stock,
    low_stock: low
  });
});

/*
   GET BY ID
*/
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

/*
   UPDATE
*/
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, stock, description } = req.body;
      const image = req.file ? req.file.filename : null;

      if (image) {
        await db.query(
          "UPDATE products SET name=?, price=?, stock=?, description=?, image=? WHERE id=?",
          [name, price, stock, description || null, image, req.params.id]
        );
      } else {
        await db.query(
          "UPDATE products SET name=?, price=?, stock=?, description=? WHERE id=?",
          [name, price, stock, description || null, req.params.id]
        );
      }

      res.json({ message: "Produk berhasil diupdate" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

/*
   DELETE
*/
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ message: "Produk berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
