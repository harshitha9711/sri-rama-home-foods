const pool = require("../config/db");

// Get all addresses
async function getAddresses(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
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
        address_type,
        is_default,
        created_at,
        updated_at
      FROM addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      addresses: result.rows,
    });
  } catch (error) {
    console.error("Get addresses error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
    });
  }
}


// Add address
async function addAddress(req, res) {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const userId = req.user.id;

    const {
      fullName,
      phone,
      houseFlat,
      areaStreet,
      city,
      state,
      pincode,
      landmark,
      addressType = "home",
      isDefault = false,
    } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------
    if (
      !fullName ||
      !phone ||
      !houseFlat ||
      !areaStreet ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required address fields",
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain 10 digits",
      });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain 6 digits",
      });
    }

    if (!["home", "work", "other"].includes(addressType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address type",
      });
    }

    // -----------------------------
    // Clean input
    // -----------------------------
    const cleanFullName = fullName.trim();
    const cleanHouseFlat = houseFlat.trim();
    const cleanAreaStreet = areaStreet.trim();
    const cleanCity = city.trim();
    const cleanState = state.trim();
    const cleanLandmark = landmark?.trim() || null;

    await client.query("BEGIN");
    transactionStarted = true;

    // -----------------------------
    // Check duplicate address
    // -----------------------------
    const duplicateCheck = await client.query(
      `
      SELECT
        id,
        is_default
      FROM addresses
      WHERE user_id = $1
        AND LOWER(TRIM(full_name)) = LOWER(TRIM($2))
        AND phone = $3
        AND LOWER(TRIM(house_flat)) = LOWER(TRIM($4))
        AND LOWER(TRIM(area_street)) = LOWER(TRIM($5))
        AND LOWER(TRIM(city)) = LOWER(TRIM($6))
        AND LOWER(TRIM(state)) = LOWER(TRIM($7))
        AND pincode = $8
        AND COALESCE(LOWER(TRIM(landmark)), '') =
            COALESCE(LOWER(TRIM($9)), '')
        AND address_type = $10
      LIMIT 1
      `,
      [
        userId,
        cleanFullName,
        phone,
        cleanHouseFlat,
        cleanAreaStreet,
        cleanCity,
        cleanState,
        pincode,
        cleanLandmark,
        addressType,
      ]
    );

    // -----------------------------
    // Duplicate found
    // -----------------------------
    if (duplicateCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        duplicate: true,
        message: "This address already exists",
        addressId: duplicateCheck.rows[0].id,
      });
    }

    // -----------------------------
    // If this is the default address,
    // remove default from existing addresses
    // -----------------------------
    if (isDefault) {
      await client.query(
        `
        UPDATE addresses
        SET
          is_default = FALSE,
          updated_at = NOW()
        WHERE user_id = $1
        `,
        [userId]
      );
    }

    // -----------------------------
    // Check if this is first address
    // -----------------------------
    const countResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM addresses
      WHERE user_id = $1
      `,
      [userId]
    );

    const shouldBeDefault =
      isDefault || countResult.rows[0].count === 0;

    // -----------------------------
    // Insert address
    // -----------------------------
    const result = await client.query(
      `
      INSERT INTO addresses (
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
        is_default
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      )
      RETURNING *
      `,
      [
        userId,
        cleanFullName,
        phone,
        cleanHouseFlat,
        cleanAreaStreet,
        cleanCity,
        cleanState,
        pincode,
        cleanLandmark,
        addressType,
        shouldBeDefault,
      ]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: result.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error("Add address error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to add address",
    });
  } finally {
    client.release();
  }
}



// Update address
async function updateAddress(req, res) {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const {
      fullName,
      phone,
      houseFlat,
      areaStreet,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    await client.query("BEGIN");

    // Verify ownership
    const existing = await client.query(
      `
      SELECT id
      FROM addresses
      WHERE id = $1
        AND user_id = $2
      `,
      [addressId, userId]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (isDefault) {
      await client.query(
        `
        UPDATE addresses
        SET is_default = FALSE,
            updated_at = NOW()
        WHERE user_id = $1
        `,
        [userId]
      );
    }

    const result = await client.query(
      `
      UPDATE addresses
      SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        house_flat = COALESCE($3, house_flat),
        area_street = COALESCE($4, area_street),
        city = COALESCE($5, city),
        state = COALESCE($6, state),
        pincode = COALESCE($7, pincode),
        landmark = COALESCE($8, landmark),
        address_type = COALESCE($9, address_type),
        is_default = COALESCE($10, is_default),
        updated_at = NOW()
      WHERE id = $11
        AND user_id = $12
      RETURNING *
      `,
      [
        fullName,
        phone,
        houseFlat,
        areaStreet,
        city,
        state,
        pincode,
        landmark,
        addressType,
        isDefault,
        addressId,
        userId,
      ]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Address updated successfully",
      address: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update address error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  } finally {
    client.release();
  }
}


// Delete address
async function deleteAddress(req, res) {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM addresses
      WHERE id = $1
        AND user_id = $2
      RETURNING id, is_default
      `,
      [addressId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If deleted address was default,
    // make another address default.
    if (result.rows[0].is_default) {
      await pool.query(
        `
        UPDATE addresses
        SET is_default = TRUE,
            updated_at = NOW()
        WHERE id = (
          SELECT id
          FROM addresses
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        )
        `,
        [userId]
      );
    }

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
}


// Set default address
async function setDefaultAddress(req, res) {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    await client.query("BEGIN");

    const address = await client.query(
      `
      SELECT id
      FROM addresses
      WHERE id = $1
        AND user_id = $2
      `,
      [addressId, userId]
    );

    if (address.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await client.query(
      `
      UPDATE addresses
      SET is_default = FALSE,
          updated_at = NOW()
      WHERE user_id = $1
      `,
      [userId]
    );

    const result = await client.query(
      `
      UPDATE addresses
      SET is_default = TRUE,
          updated_at = NOW()
      WHERE id = $1
        AND user_id = $2
      RETURNING *
      `,
      [addressId, userId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Default address updated",
      address: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Set default address error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to set default address",
    });
  } finally {
    client.release();
  }
}


module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};