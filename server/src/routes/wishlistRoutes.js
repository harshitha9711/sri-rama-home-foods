const express = require("express");

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router.get("/", getWishlist);

router.post("/:productId", addToWishlist);

router.delete("/:productId", removeFromWishlist);

module.exports = router;