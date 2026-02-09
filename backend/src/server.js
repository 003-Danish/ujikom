import express from "express";
import cors from "cors";

import authRoute from "./routes/auth.route.js";
import productRoute from "./routes/product.route.js";
import blogRoute from "./routes/blog.route.js";
import orderRoute from "./routes/order.route.js";
import dashboardRoute from "./routes/dashboard.route.js";
import userRoute from "./routes/user.route.js";
import wishlistRoute from "./routes/wishlist.route.js";


const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/dashboard", dashboardRoute);
app.use("/api/users", userRoute);

app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/blogs", blogRoute);
app.use("/api/orders", orderRoute);
app.use("/uploads", express.static("uploads"));
app.use("/api/wishlist", wishlistRoute);


app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
