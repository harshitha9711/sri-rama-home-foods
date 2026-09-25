const express = require("express");
const { v2: cloudinary } = require("cloudinary");

const pool = require("../config/db");
const { protect } = require("../middleware/authMiddleware");
const {
  assertCloudinaryConfig,
} = require("../config/cloudinary");

const router = express.Router();

/* =========================================================
   ADMIN AUTH
========================================================= */

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

/* =========================================================
   ADMIN - GET ALL CATEGORIES
========================================================= */

router.get(
  "/admin/all",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          name,
          slug,
          description,
          parent_id,
          food_type,
          image_url,
          sort_order,
          is_active,
          created_at,
          updated_at
        FROM categories
        ORDER BY
          sort_order ASC,
          name ASC
      `);

      const categories = result.rows.map((category) => ({
        id: Number(category.id),
        name: category.name,
        slug: category.slug,
        description: category.description,
        parent_id: category.parent_id
          ? Number(category.parent_id)
          : null,
        food_type: category.food_type,
        image_url: category.image_url || null,
        sort_order: Number(category.sort_order || 0),
        is_active: category.is_active,
        created_at: category.created_at,
        updated_at: category.updated_at,
      }));

      return res.json({
        success: true,
        categories,
        count: categories.length,
      });
    } catch (error) {
      console.error(
        "Admin get categories error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
      });
    }
  }
);

/* =========================================================
   ADMIN - CLOUDINARY CATEGORY IMAGE SIGNATURE
========================================================= */

router.post(
  "/upload-signature",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      assertCloudinaryConfig();

      const timestamp = Math.floor(
        Date.now() / 1000
      );

      const folder =
        "sri-rama-home-foods/categories";

      const signature =
        cloudinary.utils.api_sign_request(
          {
            timestamp,
            folder,
          },
          process.env.CLOUDINARY_API_SECRET
        );

      return res.json({
        success: true,
        timestamp,
        folder,
        signature,
        api_key:
          process.env.CLOUDINARY_API_KEY,
        cloud_name:
          process.env.CLOUDINARY_CLOUD_NAME,
      });
    } catch (error) {
      console.error(
        "Category Cloudinary signature error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to prepare category image upload",
      });
    }
  }
);

/* =========================================================
   ADMIN - UPDATE CATEGORY IMAGE
========================================================= */

router.patch(
  "/admin/:categoryId/image",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { image_url } = req.body;

      if (!image_url || !String(image_url).trim()) {
        return res.status(400).json({
          success: false,
          message: "Image URL is required",
        });
      }

      const result = await pool.query(
        `
        UPDATE categories
        SET
          image_url = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
          id,
          name,
          slug,
          description,
          parent_id,
          food_type,
          image_url,
          sort_order,
          is_active,
          created_at,
          updated_at
        `,
        [
          String(image_url).trim(),
          categoryId,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      const category = result.rows[0];

      return res.json({
        success: true,
        message: "Category image updated successfully",
        category: {
          id: Number(category.id),
          name: category.name,
          slug: category.slug,
          description: category.description,
          parent_id: category.parent_id
            ? Number(category.parent_id)
            : null,
          food_type: category.food_type,
          image_url: category.image_url || null,
          sort_order: Number(
            category.sort_order || 0
          ),
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at,
        },
      });
    } catch (error) {
      console.error(
        "Update category image error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update category image",
      });
    }
  }
);

/* =========================================================
   PUBLIC - GET ACTIVE CATEGORIES
========================================================= */

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
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
      ORDER BY
        sort_order ASC,
        name ASC
    `);

    const categories = result.rows.map(
      (category) => ({
        id: Number(category.id),
        name: category.name,
        slug: category.slug,
        description: category.description,
        parent_id: category.parent_id
          ? Number(category.parent_id)
          : null,
        food_type: category.food_type,
        image_url: category.image_url || null,
        sort_order: Number(
          category.sort_order || 0
        ),
      })
    );

    return res.json({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error(
      "Get categories error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

/* =========================================================
   PUBLIC - GET CATEGORY BY SLUG
========================================================= */

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        description,
        parent_id,
        food_type,
        image_url,
        sort_order
      FROM categories
      WHERE slug = $1
      AND is_active = TRUE
      LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const category = result.rows[0];

    return res.json({
      success: true,
      category: {
        id: Number(category.id),
        name: category.name,
        slug: category.slug,
        description: category.description,
        parent_id: category.parent_id
          ? Number(category.parent_id)
          : null,
        food_type: category.food_type,
        image_url: category.image_url || null,
        sort_order: Number(
          category.sort_order || 0
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get category error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
});

module.exports = router;