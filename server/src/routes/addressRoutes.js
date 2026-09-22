const express = require("express");

const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All address routes require authentication
router.use(protect);

// Get all addresses
router.get("/", getAddresses);

// Add address
router.post("/", addAddress);

// Update address
router.put("/:addressId", updateAddress);

// Delete address
router.delete("/:addressId", deleteAddress);

// Set default address
router.patch("/:addressId/default", setDefaultAddress);

module.exports = router;