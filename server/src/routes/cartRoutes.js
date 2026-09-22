const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All cart routes require login
router.use(protect);

router.get("/", getCart);

router.post("/", addToCart);

router.put("/:itemId", updateCartItem);

router.delete("/:itemId", removeCartItem);

router.delete("/", clearCart);

module.exports = router;