import express from "express";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();


router.get("/stock", verifyToken, async (req, res) => {
  try {
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [[totalProduct]] = await db.query(
      "SELECT COUNT(*) AS total FROM products"
    );

    const [[totalStock]] = await db.query(
      "SELECT SUM(stock) AS total FROM products"
    );

    const [lowStock] = await db.query(
      "SELECT id, name, stock FROM products WHERE stock <= 5 AND stock > 0"
    );                                                                                                                                                                                                                                                                                                                                                                                                                                                 

    const [outOfStock] = await db.query(
      "SELECT id, name FROM products WHERE stock = 0"
    );

    res.json({
      total_product: totalProduct.total,
      total_stock: totalStock.total || 0,
      low_stock: lowStock,
      out_of_stock: outOfStock
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [[orders]] = await db.query(
      "SELECT COUNT(*) total_orders, SUM(total) revenue FROM orders WHERE status='approved'"
    );

    const [[users]] = await db.query(
      "SELECT COUNT(*) total_users FROM users"
    );

    const [[products]] = await db.query(
      "SELECT COUNT(*) total_products FROM products"
    );

    res.json({
      total_orders: orders.total_orders || 0,
      revenue: orders.revenue || 0,
      total_users: users.total_users || 0,
      total_products: products.total_products || 0
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
