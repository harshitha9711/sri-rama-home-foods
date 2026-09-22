const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET all active categories
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        slug,
        description,
        parent_id,
        food_type,
        image_url,
        sort_order
       FROM categories
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, name ASC`
    );

    res.json({
      success: true,
      categories: result.rows,
    });
  } catch (error) {
    console.error("Get categories error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

module.exports = router;