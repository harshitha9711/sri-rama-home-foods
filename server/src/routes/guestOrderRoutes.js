const express = require("express");

const {
  createGuestOrder,
} = require("../controllers/guestOrderController");

const router = express.Router();

// Guest customers can place orders without logging in
router.post("/", createGuestOrder);

module.exports = router;