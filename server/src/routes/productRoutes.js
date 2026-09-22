const express = require("express");

const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  toggleProductStatus,
  getAdminProducts,
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
ADMIN PRODUCT ROUTES
=========================================================
*/

/*
GET /api/products/admin/all

Returns all products including inactive products.
Used by the Admin Product Management page.
*/
router.get(
  "/admin/all",
  protect,
  requireAdmin,
  getAdminProducts
);

/*
POST /api/products/admin

Create a new product.
*/
router.post(
  "/admin",
  protect,
  requireAdmin,
  createProduct
);

/*
PUT /api/products/admin/:id

Update an existing product.
*/
router.put(
  "/admin/:id",
  protect,
  requireAdmin,
  updateProduct
);

/*
PATCH /api/products/admin/:id/status

Activate/deactivate a product.
*/
router.patch(
  "/admin/:id/status",
  protect,
  requireAdmin,
  toggleProductStatus
);

/*
=========================================================
CUSTOMER PRODUCT ROUTES
=========================================================
*/

/*
GET /api/products

Supports:

?search=
?category=
?food_type=
?featured=true
?sort=
*/
router.get("/", getProducts);

/*
GET /api/products/:slug

Returns one active product.
*/
router.get("/:slug", getProductBySlug);

module.exports = router;