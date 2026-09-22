const pool = require("../config/db");

// Get wishlist
async function getWishlist(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        wi.id AS wishlist_item_id,

        p.id AS product_id,
        p.name,
        p.slug,
        p.short_description,
        p.food_type,
        p.main_image_url,
        p.rating,
        p.review_count,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug

      FROM wishlists w

      JOIN wishlist_items wi
        ON wi.wishlist_id = w.id

      JOIN products p
        ON p.id = wi.product_id

      JOIN categories c
        ON c.id = p.category_id

      WHERE w.user_id = $1
        AND p.is_active = TRUE

      ORDER BY wi.created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      wishlist: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Get wishlist error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
    });
  }
}


// Add product to wishlist
async function addToWishlist(req, res) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Verify product exists and is active
    const productResult = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = $1
        AND is_active = TRUE
      `,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Create wishlist if it doesn't exist
    const wishlistResult = await pool.query(
      `
      INSERT INTO wishlists (user_id)
      VALUES ($1)
      ON CONFLICT (user_id)
      DO UPDATE SET updated_at = NOW()
      RETURNING id
      `,
      [userId]
    );

    const wishlistId = wishlistResult.rows[0].id;

    // Add product
    await pool.query(
      `
      INSERT INTO wishlist_items
        (wishlist_id, product_id)
      VALUES
        ($1, $2)
      ON CONFLICT (wishlist_id, product_id)
      DO NOTHING
      `,
      [wishlistId, productId]
    );

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("Add wishlist error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to add product to wishlist",
    });
  }
}


// Remove product from wishlist
async function removeFromWishlist(req, res) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM wishlist_items wi
      USING wishlists w
      WHERE wi.wishlist_id = w.id
        AND w.user_id = $1
        AND wi.product_id = $2
      RETURNING wi.id
      `,
      [userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    res.json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Remove wishlist error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist",
    });
  }
}


module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};