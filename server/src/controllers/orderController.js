const pool = require("../config/db");

// ============================================================
// CREATE ORDER
// ============================================================
async function createOrder(req, res) {
  const client = await pool.connect();

  try {
    const userId = req.user.id;

    const { addressId, notes = null } = req.body;

    // --------------------------------------------------------
    // Validate request
    // --------------------------------------------------------
    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    await client.query("BEGIN");

    // --------------------------------------------------------
    // 1. Get customer's address
    // --------------------------------------------------------
    const addressResult = await client.query(
      `
      SELECT
        id,
        full_name,
        phone,
        house_flat,
        area_street,
        city,
        state,
        pincode,
        landmark,
        address_type
      FROM addresses
      WHERE id = $1
        AND user_id = $2
      `,
      [addressId, userId]
    );

    if (addressResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const address = addressResult.rows[0];

    // --------------------------------------------------------
    // 2. Get cart
    // --------------------------------------------------------
    const cartResult = await client.query(
      `
      SELECT id
      FROM carts
      WHERE user_id = $1
      `,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const cartId = cartResult.rows[0].id;

    // --------------------------------------------------------
    // 3. Get cart items + lock variants for stock safety
    // --------------------------------------------------------
    const cartItemsResult = await client.query(
      `
      SELECT
        ci.id AS cart_item_id,
        ci.quantity,

        p.id AS product_id,
        p.name AS product_name,
        p.is_active AS product_active,

        pv.id AS variant_id,
        pv.label AS variant_label,
        pv.price,
        pv.stock_quantity,
        pv.is_active AS variant_active

      FROM cart_items ci

      JOIN products p
        ON p.id = ci.product_id

      JOIN product_variants pv
        ON pv.id = ci.variant_id

      WHERE ci.cart_id = $1

      FOR UPDATE OF pv
      `,
      [cartId]
    );

    if (cartItemsResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // --------------------------------------------------------
    // 4. Validate products, variants and stock
    // --------------------------------------------------------
    for (const item of cartItemsResult.rows) {
      if (!item.product_active) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `${item.product_name} is no longer available`,
        });
      }

      if (!item.variant_active) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `${item.product_name} (${item.variant_label}) is no longer available`,
        });
      }

      if (item.stock_quantity < item.quantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `Only ${item.stock_quantity} units of ${item.product_name} (${item.variant_label}) are available`,
        });
      }
    }

    // --------------------------------------------------------
    // 5. Calculate subtotal SERVER-SIDE
    // --------------------------------------------------------
    const subtotal = cartItemsResult.rows.reduce(
      (total, item) =>
        total + Number(item.price) * Number(item.quantity),
      0
    );

    // --------------------------------------------------------
    // 6. Delivery is ALWAYS FREE
    // --------------------------------------------------------
    const deliveryFee = 0;

    // No coupons / discounts
    const discountAmount = 0;

    const totalAmount =
      subtotal + deliveryFee - discountAmount;

    // --------------------------------------------------------
    // 7. Payment status
    // --------------------------------------------------------
    // Customer orders through WhatsApp.
    // Customer pays separately using client's UPI/QR.
    const paymentMethod = "upi";
    const paymentStatus = "pending";

    // --------------------------------------------------------
    // 8. Create order with address snapshot
    // --------------------------------------------------------
    const orderResult = await client.query(
      `
      INSERT INTO orders (
        user_id,

        full_name,
        phone,
        house_flat,
        area_street,
        city,
        state,
        pincode,
        landmark,
        address_type,

        subtotal,
        delivery_fee,
        discount_amount,
        total_amount,

        payment_method,
        payment_status,
        order_status,

        notes
      )
      VALUES (
        $1,

        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,

        $11,
        $12,
        $13,
        $14,

        $15,
        $16,
        $17,

        $18
      )
      RETURNING
        id,
        user_id,
        subtotal,
        delivery_fee,
        discount_amount,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at
      `,
      [
        userId,

        address.full_name,
        address.phone,
        address.house_flat,
        address.area_street,
        address.city,
        address.state,
        address.pincode,
        address.landmark,
        address.address_type,

        subtotal,
        deliveryFee,
        discountAmount,
        totalAmount,

        paymentMethod,
        paymentStatus,
        "pending",

        notes,
      ]
    );

    const order = orderResult.rows[0];

    // --------------------------------------------------------
    // 9. Create order items + snapshot product information
    // --------------------------------------------------------
    for (const item of cartItemsResult.rows) {
      const itemTotal =
        Number(item.price) * Number(item.quantity);

      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          variant_id,
          product_name,
          variant_label,
          quantity,
          unit_price,
          item_total
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8
        )
        `,
        [
          order.id,
          item.product_id,
          item.variant_id,
          item.product_name,
          item.variant_label,
          item.quantity,
          item.price,
          itemTotal,
        ]
      );

      // ------------------------------------------------------
      // 10. Reduce stock
      // ------------------------------------------------------
      await client.query(
        `
        UPDATE product_variants
        SET
          stock_quantity = stock_quantity - $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [item.quantity, item.variant_id]
      );
    }

    // --------------------------------------------------------
    // 11. Clear customer's cart
    // --------------------------------------------------------
    await client.query(
      `
      DELETE FROM cart_items
      WHERE cart_id = $1
      `,
      [cartId]
    );

    // --------------------------------------------------------
    // 12. Commit transaction
    // --------------------------------------------------------
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        subtotal: Number(order.subtotal),
        delivery_fee: Number(order.delivery_fee),
        discount_amount: Number(order.discount_amount),
        total_amount: Number(order.total_amount),
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        created_at: order.created_at,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create order error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  } finally {
    client.release();
  }
}

// ============================================================
// GET MY ORDERS
// ============================================================
async function getMyOrders(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        o.id,
        o.subtotal,
        o.delivery_fee,
        o.discount_amount,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,

        COUNT(oi.id)::INTEGER AS item_count

      FROM orders o

      LEFT JOIN order_items oi
        ON oi.order_id = o.id

      WHERE o.user_id = $1

      GROUP BY o.id

      ORDER BY o.created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      orders: result.rows.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        delivery_fee: Number(order.delivery_fee),
        discount_amount: Number(order.discount_amount),
        total_amount: Number(order.total_amount),
      })),
    });
  } catch (error) {
    console.error("Get orders error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
}

// ============================================================
// GET SINGLE ORDER
// ============================================================
async function getOrderById(req, res) {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const orderResult = await pool.query(
      `
      SELECT
        id,
        user_id,

        full_name,
        phone,
        house_flat,
        area_street,
        city,
        state,
        pincode,
        landmark,
        address_type,

        subtotal,
        delivery_fee,
        discount_amount,
        total_amount,

        payment_method,
        payment_status,
        order_status,

        notes,
        created_at,
        updated_at

      FROM orders

      WHERE id = $1
        AND user_id = $2
      `,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `
      SELECT
        id,
        product_id,
        variant_id,
        product_name,
        variant_label,
        quantity,
        unit_price,
        item_total

      FROM order_items

      WHERE order_id = $1

      ORDER BY id ASC
      `,
      [orderId]
    );

    res.json({
      success: true,
      order: {
        ...order,

        subtotal: Number(order.subtotal),
        delivery_fee: Number(order.delivery_fee),
        discount_amount: Number(order.discount_amount),
        total_amount: Number(order.total_amount),

        items: itemsResult.rows.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          item_total: Number(item.item_total),
        })),
      },
    });
  } catch (error) {
    console.error("Get order error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
}

// ============================================================
// CANCEL ORDER
// ============================================================
async function cancelOrder(req, res) {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      SELECT
        id,
        order_status,
        payment_status
      FROM orders
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE
      `,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    // Customer can only cancel before shipping
    const cancellableStatuses = [
      "pending",
      "confirmed",
      "processing",
    ];

    if (!cancellableStatuses.includes(order.order_status)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled",
      });
    }

    const itemsResult = await client.query(
      `
      SELECT
        variant_id,
        quantity
      FROM order_items
      WHERE order_id = $1
      `,
      [orderId]
    );

    // Restore stock
    for (const item of itemsResult.rows) {
      if (item.variant_id) {
        await client.query(
          `
          UPDATE product_variants
          SET
            stock_quantity = stock_quantity + $1,
            updated_at = NOW()
          WHERE id = $2
          `,
          [item.quantity, item.variant_id]
        );
      }
    }

    const newPaymentStatus =
      order.payment_status === "paid"
        ? "refunded"
        : order.payment_status;

    await client.query(
      `
      UPDATE orders
      SET
        order_status = 'cancelled',
        payment_status = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [newPaymentStatus, orderId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Cancel order error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  } finally {
    client.release();
  }
}

// ============================================================
// ADMIN — GET ALL ORDERS
// ============================================================
async function getAdminOrders(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.user_id,

        o.full_name,
        o.phone,
        o.city,
        o.state,
        o.pincode,

        o.subtotal,
        o.delivery_fee,
        o.discount_amount,
        o.total_amount,

        o.payment_method,
        o.payment_status,
        o.order_status,

        o.created_at,
        o.updated_at,

        u.name AS customer_name,
        u.email AS customer_email,

        COUNT(oi.id)::INTEGER AS item_count

      FROM orders o

      LEFT JOIN users u
        ON u.id = o.user_id

      LEFT JOIN order_items oi
        ON oi.order_id = o.id

      GROUP BY
        o.id,
        u.name,
        u.email

      ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,

      orders: result.rows.map((order) => ({
        ...order,

        subtotal: Number(order.subtotal),
        delivery_fee: Number(order.delivery_fee),
        discount_amount: Number(order.discount_amount),
        total_amount: Number(order.total_amount),

        item_count: Number(order.item_count),
      })),
    });
  } catch (error) {
    console.error(
      "Admin get orders error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch admin orders",
    });
  }
}

// ============================================================
// ADMIN — GET SINGLE ORDER
// ============================================================
async function getAdminOrderById(req, res) {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      `
      SELECT
        o.*,

        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_account_phone

      FROM orders o

      LEFT JOIN users u
        ON u.id = o.user_id

      WHERE o.id = $1
      `,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `
      SELECT
        id,
        product_id,
        variant_id,
        product_name,
        variant_label,
        quantity,
        unit_price,
        item_total

      FROM order_items

      WHERE order_id = $1

      ORDER BY id ASC
      `,
      [orderId]
    );

    res.json({
      success: true,

      order: {
        ...order,

        subtotal: Number(order.subtotal),
        delivery_fee: Number(order.delivery_fee),
        discount_amount: Number(order.discount_amount),
        total_amount: Number(order.total_amount),

        items: itemsResult.rows.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          item_total: Number(item.item_total),
        })),
      },
    });
  } catch (error) {
    console.error(
      "Admin get order error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
}

// ============================================================
// ADMIN — UPDATE ORDER STATUS
// ============================================================
async function updateAdminOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET
        order_status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        order_status,
        payment_status,
        updated_at
      `,
      [orderStatus, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Admin update order status error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
}

// ============================================================
// ADMIN — ORDER STATISTICS
// ============================================================
async function getAdminOrderStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT

        COUNT(*)::INTEGER AS total_orders,

        COUNT(*) FILTER (
          WHERE order_status = 'pending'
        )::INTEGER AS pending_orders,

        COUNT(*) FILTER (
          WHERE order_status = 'confirmed'
        )::INTEGER AS confirmed_orders,

        COUNT(*) FILTER (
          WHERE order_status = 'processing'
        )::INTEGER AS processing_orders,

        COUNT(*) FILTER (
          WHERE order_status = 'shipped'
        )::INTEGER AS shipped_orders,

        COUNT(*) FILTER (
          WHERE order_status = 'delivered'
        )::INTEGER AS delivered_orders,

        COUNT(*) FILTER (
          WHERE order_status = 'cancelled'
        )::INTEGER AS cancelled_orders,

        COALESCE(
          SUM(total_amount)
          FILTER (
            WHERE order_status != 'cancelled'
          ),
          0
        ) AS total_revenue

      FROM orders
    `);

    const stats = result.rows[0];

    res.json({
      success: true,

      stats: {
        total_orders: Number(stats.total_orders),
        pending_orders: Number(stats.pending_orders),
        confirmed_orders: Number(stats.confirmed_orders),
        processing_orders: Number(stats.processing_orders),
        shipped_orders: Number(stats.shipped_orders),
        delivered_orders: Number(stats.delivered_orders),
        cancelled_orders: Number(stats.cancelled_orders),
        total_revenue: Number(stats.total_revenue),
      },
    });
  } catch (error) {
    console.error(
      "Admin order stats error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,

  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  getAdminOrderStats,
};