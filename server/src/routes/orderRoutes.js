const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  getAdminOrderStats,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// ADMIN MIDDLEWARE
// ============================================================

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
}


// ============================================================
// ADMIN ORDER ROUTES
// IMPORTANT: KEEP THESE ABOVE "/:orderId"
// ============================================================

// Admin order statistics
router.get(
  "/admin/stats",
  protect,
  requireAdmin,
  getAdminOrderStats
);

// Get all orders for admin
router.get(
  "/admin/all",
  protect,
  requireAdmin,
  getAdminOrders
);

// Get single order for admin
router.get(
  "/admin/:orderId",
  protect,
  requireAdmin,
  getAdminOrderById
);

// Update order status from admin
router.patch(
  "/admin/:orderId/status",
  protect,
  requireAdmin,
  updateAdminOrderStatus
);


// ============================================================
// CUSTOMER ORDER ROUTES
// ============================================================

// Create order
router.post(
  "/",
  protect,
  createOrder
);

// Get logged-in customer's orders
router.get(
  "/",
  protect,
  getMyOrders
);

// Get customer's single order
router.get(
  "/:orderId",
  protect,
  getOrderById
);

// Cancel customer's order
router.patch(
  "/:orderId/cancel",
  protect,
  cancelOrder
);


module.exports = router;