const pool = require("../config/db");

// Get user's cart
async function getCart(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        ci.id AS cart_item_id,
        ci.quantity,

        p.id AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        p.food_type,
        p.main_image_url,

        pv.id AS variant_id,
        pv.label AS variant_label,
        pv.weight_grams,
        pv.price,
        pv.stock_quantity

      FROM carts c
      JOIN cart_items ci
        ON ci.cart_id = c.id
      JOIN products p
        ON p.id = ci.product_id
      JOIN product_variants pv
        ON pv.id = ci.variant_id

      WHERE c.user_id = $1

      ORDER BY ci.created_at DESC
      `,
      [userId]
    );

    const items = result.rows.map((item) => ({
      cart_item_id: item.cart_item_id,
      quantity: Number(item.quantity),

      product: {
        id: item.product_id,
        name: item.product_name,
        slug: item.product_slug,
        food_type: item.food_type,
        main_image_url: item.main_image_url,
      },

      variant: {
        id: item.variant_id,
        label: item.variant_label,
        weight_grams: item.weight_grams,
        price: Number(item.price),
        stock_quantity: Number(item.stock_quantity),
      },

      item_total: Number(item.price) * Number(item.quantity),
    }));

    const subtotal = items.reduce(
      (total, item) => total + item.item_total,
      0
    );

    res.json({
      success: true,
      cart: {
        items,
        item_count: items.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        subtotal,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
}


// Add item to cart
async function addToCart(req, res) {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const userId = req.user.id;
    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId || !variantId) {
      return res.status(400).json({
        success: false,
        message: "Product and variant are required",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const productResult = await client.query(
      `
      SELECT
        p.id AS product_id,
        p.is_active AS product_active,
        pv.id AS variant_id,
        pv.stock_quantity,
        pv.is_active AS variant_active
      FROM products p
      JOIN product_variants pv
        ON pv.product_id = p.id
      WHERE p.id = $1
        AND pv.id = $2
      `,
      [productId, variantId]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Product or variant not found",
      });
    }

    const product = productResult.rows[0];

    if (!product.product_active || !product.variant_active) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Product is unavailable",
      });
    }

    if (Number(product.stock_quantity) < quantity) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });
    }

    const cartResult = await client.query(
      `
      INSERT INTO carts (user_id)
      VALUES ($1)
      ON CONFLICT (user_id)
      DO UPDATE SET updated_at = NOW()
      RETURNING id
      `,
      [userId]
    );

    const cartId = cartResult.rows[0].id;

    await client.query(
      `
      INSERT INTO cart_items
        (cart_id, product_id, variant_id, quantity)
      VALUES
        ($1, $2, $3, $4)
      ON CONFLICT (cart_id, variant_id)
      DO UPDATE SET
        quantity = cart_items.quantity + EXCLUDED.quantity,
        updated_at = NOW()
      `,
      [cartId, productId, variantId, quantity]
    );

    const finalQuantity = await client.query(
      `
      SELECT quantity
      FROM cart_items
      WHERE cart_id = $1
        AND variant_id = $2
      `,
      [cartId, variantId]
    );

    if (
      finalQuantity.rows.length === 0 ||
      Number(finalQuantity.rows[0].quantity) >
        Number(product.stock_quantity)
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    await client.query("COMMIT");
    transactionStarted = false;

    res.status(201).json({
      success: true,
      message: "Product added to cart",
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error("Add cart error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  } finally {
    client.release();
  }
}


// Update cart item quantity
async function updateCartItem(req, res) {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const result = await pool.query(
      `
      UPDATE cart_items ci
      SET
        quantity = $1,
        updated_at = NOW()

      FROM carts c
      JOIN product_variants pv
        ON pv.id = ci.variant_id

      WHERE ci.id = $2
        AND ci.cart_id = c.id
        AND c.user_id = $3
        AND $1 <= pv.stock_quantity

      RETURNING ci.id
      `,
      [quantity, itemId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to update cart item. Quantity may exceed available stock.",
      });
    }

    res.json({
      success: true,
      message: "Cart updated successfully",
    });
  } catch (error) {
    console.error("Update cart error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  }
}


// Remove cart item
async function removeCartItem(req, res) {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM cart_items ci
      USING carts c
      WHERE ci.id = $1
        AND ci.cart_id = c.id
        AND c.user_id = $2
      RETURNING ci.id
      `,
      [itemId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Remove cart error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to remove cart item",
    });
  }
}


// Clear cart
async function clearCart(req, res) {
  try {
    const userId = req.user.id;

    await pool.query(
      `
      DELETE FROM cart_items
      WHERE cart_id = (
        SELECT id
        FROM carts
        WHERE user_id = $1
      )
      `,
      [userId]
    );

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear cart error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
}


module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};