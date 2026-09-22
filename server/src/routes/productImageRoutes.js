const express = require("express");

const {
  getProductImageSignature,
  syncProductImages,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/*
=========================================================
ADMIN AUTHORIZATION
=========================================================
*/

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

/*
=========================================================
CLOUDINARY IMAGE ROUTES
=========================================================
*/

/*
POST /api/product-images/signature

Creates a signed Cloudinary upload signature.

Admin only.
*/
router.post(
  "/signature",
  protect,
  requireAdmin,
  getProductImageSignature
);

/*
PUT /api/product-images/:productId/sync

Synchronizes uploaded Cloudinary images with the product.

Admin only.
*/
router.put(
  "/:productId/sync",
  protect,
  requireAdmin,
  syncProductImages
);

module.exports = router;