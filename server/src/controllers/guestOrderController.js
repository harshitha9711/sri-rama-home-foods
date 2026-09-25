const pool = require("../config/db");

async function createGuestOrder(req, res) {
  const client = await pool.connect();

  try {
    const {
      customer,
      address,
      items,
      notes = null,
    } = req.body;

    if (!customer?.fullName || !customer?.phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required",
      });
    }

    if (
      !address?.houseFlat ||
      !address?.areaStreet ||
      !address?.city ||
      !address?.state ||
      !address?.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete delivery address is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    await client.query("BEGIN");

    const normalizedItems = items.map((item) => ({
      productId: Number(item.productId),
      variantId: Number(item.variantId),
      quantity: Number(item.quantity),
    }));

    for (const item of normalizedItems) {
      if (
        !Number.isInteger(item.productId) ||
        !Number.isInteger(item.variantId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Invalid cart item",
        });
      }
    }

    const variantIds = normalizedItems.map((item) => item.variantId);

    const productResult = await client.query(
      `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.is_active AS product_active,

        pv.id AS variant_id,
        pv.label AS variant_label,
        pv.price,
        pv.stock_quantity,
        pv.is_active AS variant_active

      FROM product_variants pv

      JOIN products p
        ON p.id = pv.product_id

      WHERE pv.id = ANY($1::bigint[])

      FOR UPDATE OF pv
      `,
      [variantIds]
    );

    const variantMap = new Map(
      productResult.rows.map((row) => [
        Number(row.variant_id),
        row,
      ])
    );

    let subtotal = 0;
    const orderItems = [];

    for (const requested of normalizedItems) {
      const item = variantMap.get(requested.variantId);

      if (!item) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "One of the selected products is no longer available",
        });
      }

      if (
        Number(item.product_id) !== requested.productId ||
        !item.product_active ||
        !item.variant_active
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `${item.product_name} is no longer available`,
        });
      }

      if (Number(item.stock_quantity) < requested.quantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `${item.product_name} (${item.variant_label}) has only ${item.stock_quantity} available`,
        });
      }

      const unitPrice = Number(item.price);
      const itemTotal = unitPrice * requested.quantity;

      subtotal += itemTotal;

      orderItems.push({
        productId: Number(item.product_id),
        variantId: Number(item.variant_id),
        productName: item.product_name,
        variantLabel: item.variant_label,
        quantity: requested.quantity,
        unitPrice,
        itemTotal,
      });
    }

    const deliveryFee = 0;
    const discountAmount = 0;
    const totalAmount = subtotal;

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
        notes,
        address_district,
        address_country
      )
      VALUES (
        NULL,
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
        'upi',
        'pending',
        'pending',
        $14,
        $15,
        'India'
      )
      RETURNING
        id,
        full_name,
        phone,
        subtotal,
        delivery_fee,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at
      `,
      [
        customer.fullName.trim(),
        customer.phone.trim(),
        address.houseFlat.trim(),
        address.areaStreet.trim(),
        address.city.trim(),
        address.state.trim(),
        address.pincode.trim(),
        address.landmark?.trim() || null,
        address.addressType || "home",
        subtotal,
        deliveryFee,
        discountAmount,
        totalAmount,
        notes,
        address.district?.trim() || null,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of orderItems) {
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
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          order.id,
          item.productId,
          item.variantId,
          item.productName,
          item.variantLabel,
          item.quantity,
          item.unitPrice,
          item.itemTotal,
        ]
      );

      await client.query(
        `
        UPDATE product_variants
        SET
          stock_quantity = stock_quantity - $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [item.quantity, item.variantId]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: Number(order.id),
        full_name: order.full_name,
        phone: order.phone,
        subtotal: Number(order.subtotal),
        delivery_fee: Number(order.delivery_fee),
        total_amount: Number(order.total_amount),
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        created_at: order.created_at,
      },
      items: orderItems,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Guest order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  } finally {
    client.release();
  }
}

module.exports = {
  createGuestOrder,
};