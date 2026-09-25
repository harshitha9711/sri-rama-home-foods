const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

// Routes
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productImageRoutes = require("./routes/productImageRoutes");
const guestOrderRoutes = require("./routes/guestOrderRoutes");

const { protect } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// CORS
// --------------------------------------------------

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests such as Postman/server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

// --------------------------------------------------
// BODY PARSER
// --------------------------------------------------

app.use(express.json({ limit: "100kb" }));

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Home Foods API is running 🚀",
  });
});

// --------------------------------------------------
// DATABASE TEST
// --------------------------------------------------

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    res.status(200).json({
      success: true,
      message: "PostgreSQL connected successfully",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("❌ Database test failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// CURRENT USER
// --------------------------------------------------

app.get("/api/auth/me", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        is_active,
        created_at
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Get current user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/product-images", productImageRoutes);
app.use("/api/guest-orders", guestOrderRoutes);
// --------------------------------------------------
// 404 HANDLER
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked this request",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {

  console.log("🚀 Sri Rama Home Foods API");

});