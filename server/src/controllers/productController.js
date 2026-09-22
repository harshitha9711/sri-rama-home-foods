const pool = require("../config/db");
const {
  cloudinary,
  assertCloudinaryConfig,
} = require("../config/cloudinary");

/*
=========================================================
HELPERS
=========================================================
*/

function slugify(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function normalizeOptionalNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/*
=========================================================
CUSTOMER - GET PRODUCTS
=========================================================
*/

async function getProducts(req, res) {
  try {
    const {
      search,
      category,
      food_type,
      featured,
      sort = "newest",
    } = req.query;

    const values = [];
    const conditions = ["p.is_active = TRUE"];

    /*
    SEARCH
    */
    if (search?.trim()) {
      values.push(`%${search.trim()}%`);

      conditions.push(`
        (
          p.name ILIKE $${values.length}
          OR p.short_description ILIKE $${values.length}
          OR p.description ILIKE $${values.length}
        )
      `);
    }

    /*
    CATEGORY

    Supports:
    - parent category slug
    - child category slug

    Example:
    pickles
    veg-pickles
    non-veg-pickles
    */
    if (category?.trim()) {
      values.push(category.trim());

      conditions.push(`
        (
          c.slug = $${values.length}
          OR pc.slug = $${values.length}
        )
      `);
    }

    /*
    FOOD TYPE
    */
    if (
      food_type &&
      ["veg", "non_veg", "mixed"].includes(food_type)
    ) {
      values.push(food_type);

      conditions.push(
        `p.food_type = $${values.length}`
      );
    }

    /*
    FEATURED
    */
    if (featured === "true") {
      conditions.push("p.is_featured = TRUE");
    }

    /*
    SORT
    */
    let orderBy = "p.created_at DESC";

    switch (sort) {
      case "price_asc":
        orderBy = `
          (
            SELECT MIN(pv.price)
            FROM product_variants pv
            WHERE pv.product_id = p.id
              AND pv.is_active = TRUE
          ) ASC NULLS LAST
        `;
        break;

      case "price_desc":
        orderBy = `
          (
            SELECT MIN(pv.price)
            FROM product_variants pv
            WHERE pv.product_id = p.id
              AND pv.is_active = TRUE
          ) DESC NULLS LAST
        `;
        break;

      case "name_asc":
        orderBy = "p.name ASC";
        break;

      case "name_desc":
        orderBy = "p.name DESC";
        break;

      default:
        orderBy = "p.created_at DESC";
    }

    const query = `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.short_description,
        p.description,
        p.ingredients,
        p.food_type,
        p.main_image_url,
        p.rating,
        p.review_count,
        p.is_featured,
        p.is_active,
        p.created_at,
        p.updated_at,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        c.parent_id AS category_parent_id,

        pc.name AS parent_category_name,
        pc.slug AS parent_category_slug

      FROM products p

      JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN categories pc
        ON pc.id = c.parent_id

      WHERE ${conditions.join(" AND ")}

      ORDER BY ${orderBy}
    `;

    const result = await pool.query(query, values);

    const products = [];

    for (const row of result.rows) {
      /*
      ACTIVE VARIANTS
      */
      const variantsResult = await pool.query(
        `
        SELECT
          id,
          label,
          weight_grams,
          price,
          original_price,
          stock_quantity,
          sku,
          is_active
        FROM product_variants
        WHERE product_id = $1
          AND is_active = TRUE
        ORDER BY weight_grams ASC NULLS LAST, id ASC
        `,
        [row.id]
      );

      /*
      PRODUCT IMAGES
      */
      const imagesResult = await pool.query(
        `
        SELECT
          id,
          image_url,
          public_id,
          alt_text,
          sort_order,
          is_primary
        FROM product_images
        WHERE product_id = $1
        ORDER BY sort_order ASC, id ASC
        `,
        [row.id]
      );

      products.push({
        id: Number(row.id),

        name: row.name,
        slug: row.slug,

        short_description:
          row.short_description,

        description:
          row.description,

        ingredients:
          row.ingredients,

        food_type:
          row.food_type,

        main_image_url:
          row.main_image_url,

        /*
        Kept for database compatibility.
        Customer UI does NOT display reviews.
        */
        rating: normalizeNumber(
          row.rating,
          0
        ),

        review_count: normalizeNumber(
          row.review_count,
          0
        ),

        is_featured:
          row.is_featured,

        is_active:
          row.is_active,

        category: {
          id: Number(row.category_id),

          name:
            row.category_name,

          slug:
            row.category_slug,

          parent_id:
            row.category_parent_id
              ? Number(row.category_parent_id)
              : null,

          parent_name:
            row.parent_category_name,

          parent_slug:
            row.parent_category_slug,
        },

        variants:
          variantsResult.rows.map(
            (variant) => ({
              id: Number(variant.id),

              label:
                variant.label,

              weight_grams:
                normalizeOptionalNumber(
                  variant.weight_grams
                ),

              price:
                normalizeNumber(
                  variant.price
                ),

              original_price:
                normalizeOptionalNumber(
                  variant.original_price
                ),

              stock_quantity:
                normalizeNumber(
                  variant.stock_quantity
                ),

              sku:
                variant.sku,

              is_active:
                variant.is_active,
            })
          ),

        images:
          imagesResult.rows.map(
            (image) => ({
              id: Number(image.id),

              image_url:
                image.image_url,

              public_id:
                image.public_id,

              alt_text:
                image.alt_text,

              sort_order:
                normalizeNumber(
                  image.sort_order
                ),

              is_primary:
                image.is_primary,
            })
          ),
      });
    }

    return res.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
}

/*
=========================================================
CUSTOMER - GET SINGLE PRODUCT
=========================================================
*/

async function getProductBySlug(req, res) {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.*,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        c.parent_id AS category_parent_id,

        pc.name AS parent_category_name,
        pc.slug AS parent_category_slug

      FROM products p

      JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN categories pc
        ON pc.id = c.parent_id

      WHERE p.slug = $1
        AND p.is_active = TRUE

      LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const row = result.rows[0];

    /*
    ACTIVE VARIANTS
    */
    const variantsResult = await pool.query(
      `
      SELECT
        id,
        label,
        weight_grams,
        price,
        original_price,
        stock_quantity,
        sku,
        is_active
      FROM product_variants
      WHERE product_id = $1
        AND is_active = TRUE
      ORDER BY weight_grams ASC NULLS LAST, id ASC
      `,
      [row.id]
    );

    /*
    PRODUCT IMAGES
    */
    const imagesResult = await pool.query(
      `
      SELECT
        id,
        image_url,
        public_id,
        alt_text,
        sort_order,
        is_primary
      FROM product_images
      WHERE product_id = $1
      ORDER BY sort_order ASC, id ASC
      `,
      [row.id]
    );

    return res.json({
      success: true,

      product: {
        id: Number(row.id),

        name:
          row.name,

        slug:
          row.slug,

        short_description:
          row.short_description,

        description:
          row.description,

        ingredients:
          row.ingredients,

        food_type:
          row.food_type,

        main_image_url:
          row.main_image_url,

        /*
        Kept for DB/API compatibility.
        Reviews are not shown in the UI.
        */
        rating:
          normalizeNumber(
            row.rating,
            0
          ),

        review_count:
          normalizeNumber(
            row.review_count,
            0
          ),

        is_featured:
          row.is_featured,

        is_active:
          row.is_active,

        category: {
          id:
            Number(row.category_id),

          name:
            row.category_name,

          slug:
            row.category_slug,

          parent_id:
            row.category_parent_id
              ? Number(row.category_parent_id)
              : null,

          parent_name:
            row.parent_category_name,

          parent_slug:
            row.parent_category_slug,
        },

        variants:
          variantsResult.rows.map(
            (variant) => ({
              id:
                Number(variant.id),

              label:
                variant.label,

              weight_grams:
                normalizeOptionalNumber(
                  variant.weight_grams
                ),

              price:
                normalizeNumber(
                  variant.price
                ),

              original_price:
                normalizeOptionalNumber(
                  variant.original_price
                ),

              stock_quantity:
                normalizeNumber(
                  variant.stock_quantity
                ),

              sku:
                variant.sku,

              is_active:
                variant.is_active,
            })
          ),

        images:
          imagesResult.rows.map(
            (image) => ({
              id:
                Number(image.id),

              image_url:
                image.image_url,

              public_id:
                image.public_id,

              alt_text:
                image.alt_text,

              sort_order:
                normalizeNumber(
                  image.sort_order
                ),

              is_primary:
                image.is_primary,
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
}

/*
=========================================================
ADMIN - CREATE PRODUCT
=========================================================
*/

async function createProduct(req, res) {
  const client = await pool.connect();

  try {
    const {
      name,
      category_id,
      short_description,
      description,
      ingredients,
      food_type,
      main_image_url,
      is_featured,
      variants = [],
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (
      !["veg", "non_veg", "mixed"].includes(
        food_type
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid food type is required",
      });
    }

    if (
      !Array.isArray(variants) ||
      variants.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one product variant is required",
      });
    }

    /*
    Validate category.
    */
    const categoryCheck =
      await client.query(
        `
        SELECT id
        FROM categories
        WHERE id = $1
          AND is_active = TRUE
        `,
        [category_id]
      );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Selected category does not exist",
      });
    }

    /*
    Generate unique slug.
    */
    const baseSlug =
      slugify(name);

    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing =
        await client.query(
          `
          SELECT id
          FROM products
          WHERE slug = $1
          LIMIT 1
          `,
          [slug]
        );

      if (
        existing.rows.length === 0
      ) {
        break;
      }

      slug =
        `${baseSlug}-${counter}`;

      counter += 1;
    }

    await client.query("BEGIN");

    /*
    Create product.
    */
    const productResult =
      await client.query(
        `
        INSERT INTO products (
          category_id,
          name,
          slug,
          short_description,
          description,
          ingredients,
          food_type,
          main_image_url,
          is_featured,
          is_active
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
          TRUE
        )
        RETURNING *
        `,
        [
          category_id,
          name.trim(),
          slug,
          short_description?.trim() ||
            null,
          description?.trim() ||
            null,
          ingredients?.trim() ||
            null,
          food_type,
          main_image_url?.trim() ||
            null,
          Boolean(is_featured),
        ]
      );

    const product =
      productResult.rows[0];

    /*
    Create variants.
    */
    for (const variant of variants) {
      if (
        !variant.label ||
        variant.price === undefined
      ) {
        throw new Error(
          "Every variant requires a label and price"
        );
      }

      await client.query(
        `
        INSERT INTO product_variants (
          product_id,
          label,
          weight_grams,
          price,
          original_price,
          stock_quantity,
          sku,
          is_active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          TRUE
        )
        `,
        [
          product.id,

          variant.label.trim(),

          normalizeOptionalNumber(
            variant.weight_grams
          ),

          normalizeNumber(
            variant.price
          ),

          normalizeOptionalNumber(
            variant.original_price
          ),

          Math.max(
            0,
            normalizeNumber(
              variant.stock_quantity
            )
          ),

          variant.sku?.trim() ||
            null,
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message:
        "Product created successfully",

      product: {
        id:
          Number(product.id),

        name:
          product.name,

        slug:
          product.slug,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Create product error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create product",
    });
  } finally {
    client.release();
  }
}

/*
=========================================================
ADMIN - UPDATE PRODUCT
=========================================================
*/

async function updateProduct(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      name,
      category_id,
      short_description,
      description,
      ingredients,
      food_type,
      main_image_url,
      is_featured,
      is_active,
      variants = [],
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Product name is required",
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message:
          "Category is required",
      });
    }

    if (
      !["veg", "non_veg", "mixed"].includes(
        food_type
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid food type is required",
      });
    }

    if (
      !Array.isArray(variants) ||
      variants.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one product variant is required",
      });
    }

    /*
    Check product.
    */
    const existingProduct =
      await client.query(
        `
        SELECT id, slug
        FROM products
        WHERE id = $1
        `,
        [id]
      );

    if (
      existingProduct.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    /*
    Check category.
    */
    const categoryCheck =
      await client.query(
        `
        SELECT id
        FROM categories
        WHERE id = $1
          AND is_active = TRUE
        `,
        [category_id]
      );

    if (
      categoryCheck.rows.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected category does not exist",
      });
    }

    const currentSlug =
      existingProduct.rows[0].slug;

    await client.query("BEGIN");

    /*
    Update product.
    */
    await client.query(
      `
      UPDATE products
      SET
        category_id = $1,
        name = $2,
        short_description = $3,
        description = $4,
        ingredients = $5,
        food_type = $6,
        main_image_url = $7,
        is_featured = $8,
        is_active = $9,
        updated_at = NOW()
      WHERE id = $10
      `,
      [
        category_id,

        name.trim(),

        short_description?.trim() ||
          null,

        description?.trim() ||
          null,

        ingredients?.trim() ||
          null,

        food_type,

        main_image_url?.trim() ||
          null,

        Boolean(is_featured),

        is_active !== false,

        id,
      ]
    );

    /*
    Deactivate previous variants.

    Existing variant IDs submitted by the admin
    are then reactivated/updated.
    */
    await client.query(
      `
      UPDATE product_variants
      SET
        is_active = FALSE,
        updated_at = NOW()
      WHERE product_id = $1
      `,
      [id]
    );

    /*
    Update/create variants.
    */
    for (const variant of variants) {
      if (
        !variant.label ||
        variant.price === undefined
      ) {
        throw new Error(
          "Every variant requires a label and price"
        );
      }

      if (variant.id) {
        await client.query(
          `
          UPDATE product_variants
          SET
            label = $1,
            weight_grams = $2,
            price = $3,
            original_price = $4,
            stock_quantity = $5,
            sku = $6,
            is_active = TRUE,
            updated_at = NOW()
          WHERE id = $7
            AND product_id = $8
          `,
          [
            variant.label.trim(),

            normalizeOptionalNumber(
              variant.weight_grams
            ),

            normalizeNumber(
              variant.price
            ),

            normalizeOptionalNumber(
              variant.original_price
            ),

            Math.max(
              0,
              normalizeNumber(
                variant.stock_quantity
              )
            ),

            variant.sku?.trim() ||
              null,

            variant.id,

            id,
          ]
        );
      } else {
        await client.query(
          `
          INSERT INTO product_variants (
            product_id,
            label,
            weight_grams,
            price,
            original_price,
            stock_quantity,
            sku,
            is_active
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            TRUE
          )
          `,
          [
            id,

            variant.label.trim(),

            normalizeOptionalNumber(
              variant.weight_grams
            ),

            normalizeNumber(
              variant.price
            ),

            normalizeOptionalNumber(
              variant.original_price
            ),

            Math.max(
              0,
              normalizeNumber(
                variant.stock_quantity
              )
            ),

            variant.sku?.trim() ||
              null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message:
        "Product updated successfully",

      product: {
        id:
          Number(id),

        name:
          name.trim(),

        slug:
          currentSlug,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update product error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update product",
    });
  } finally {
    client.release();
  }
}

/*
=========================================================
ADMIN - TOGGLE PRODUCT STATUS
=========================================================
*/

async function toggleProductStatus(req, res) {
  try {
    const { id } = req.params;

    const result =
      await pool.query(
        `
        UPDATE products
        SET
          is_active = NOT is_active,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, is_active
        `,
        [id]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    const product =
      result.rows[0];

    return res.json({
      success: true,

      message:
        product.is_active
          ? "Product activated"
          : "Product deactivated",

      product: {
        id:
          Number(product.id),

        name:
          product.name,

        is_active:
          product.is_active,
      },
    });
  } catch (error) {
    console.error(
      "Toggle product status error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to change product status",
    });
  }
}

/*
=========================================================
ADMIN - GET ALL PRODUCTS
=========================================================
*/

async function getAdminProducts(req, res) {
  try {
    const result =
      await pool.query(
        `
        SELECT
          p.id,
          p.name,
          p.slug,
          p.short_description,
          p.description,
          p.ingredients,
          p.food_type,
          p.main_image_url,
          p.rating,
          p.review_count,
          p.is_featured,
          p.is_active,
          p.created_at,
          p.updated_at,

          c.id AS category_id,
          c.name AS category_name,
          c.slug AS category_slug

        FROM products p

        JOIN categories c
          ON c.id = p.category_id

        ORDER BY p.created_at DESC
        `
      );

    const products = [];

    for (const row of result.rows) {
      const variantsResult =
        await pool.query(
          `
          SELECT
            id,
            label,
            weight_grams,
            price,
            original_price,
            stock_quantity,
            sku,
            is_active
          FROM product_variants
          WHERE product_id = $1
          ORDER BY
            weight_grams ASC NULLS LAST,
            id ASC
          `,
          [row.id]
        );

      const imagesResult =
        await pool.query(
          `
          SELECT
            id,
            image_url,
            public_id,
            alt_text,
            sort_order,
            is_primary
          FROM product_images
          WHERE product_id = $1
          ORDER BY
            sort_order ASC,
            id ASC
          `,
          [row.id]
        );

      products.push({
        id:
          Number(row.id),

        name:
          row.name,

        slug:
          row.slug,

        short_description:
          row.short_description,

        description:
          row.description,

        ingredients:
          row.ingredients,

        food_type:
          row.food_type,

        main_image_url:
          row.main_image_url,

        rating:
          normalizeNumber(
            row.rating,
            0
          ),

        review_count:
          normalizeNumber(
            row.review_count,
            0
          ),

        is_featured:
          row.is_featured,

        is_active:
          row.is_active,

        category: {
          id:
            Number(row.category_id),

          name:
            row.category_name,

          slug:
            row.category_slug,
        },

        variants:
          variantsResult.rows.map(
            (variant) => ({
              id:
                Number(variant.id),

              label:
                variant.label,

              weight_grams:
                normalizeOptionalNumber(
                  variant.weight_grams
                ),

              price:
                normalizeNumber(
                  variant.price
                ),

              original_price:
                normalizeOptionalNumber(
                  variant.original_price
                ),

              stock_quantity:
                normalizeNumber(
                  variant.stock_quantity
                ),

              sku:
                variant.sku,

              is_active:
                variant.is_active,
            })
          ),

        images:
          imagesResult.rows.map(
            (image) => ({
              id:
                Number(image.id),

              image_url:
                image.image_url,

              public_id:
                image.public_id,

              alt_text:
                image.alt_text,

              sort_order:
                normalizeNumber(
                  image.sort_order
                ),

              is_primary:
                image.is_primary,
            })
          ),
      });
    }

    return res.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error(
      "Get admin products error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch admin products",
    });
  }
}

/*
=========================================================
ADMIN - CLOUDINARY IMAGE SIGNATURE
=========================================================
*/

async function getProductImageSignature(
  req,
  res
) {
  try {
    assertCloudinaryConfig();

    const timestamp =
      Math.floor(Date.now() / 1000);

    const folder =
      "sri-rama-home-foods/products";

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
      "Cloudinary signature error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to prepare image upload",
    });
  }
}

/*
=========================================================
ADMIN - SYNC PRODUCT IMAGES
=========================================================
*/

async function syncProductImages(req, res) {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    assertCloudinaryConfig();

    const { productId } = req.params;
    const { images = [] } = req.body;

    if (!productId || !Number.isInteger(Number(productId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: "Images must be an array",
      });
    }

    if (images.length > 12) {
      return res.status(400).json({
        success: false,
        message: "A product can have at most 12 images",
      });
    }

    /*
    =====================================================
    VERIFY PRODUCT
    =====================================================
    */

    const productResult = await client.query(
      `
      SELECT id
      FROM products
      WHERE id = $1
      LIMIT 1
      `,
      [Number(productId)]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /*
    =====================================================
    NORMALIZE IMAGE DATA
    =====================================================
    */

    const normalized = images.map((image, index) => ({
      id:
        image?.id !== undefined &&
        image?.id !== null &&
        image?.id !== ""
          ? Number(image.id)
          : null,

      image_url: String(
        image?.image_url || ""
      ).trim(),

      public_id: String(
        image?.public_id || ""
      ).trim(),

      alt_text:
        String(image?.alt_text || "").trim() || null,

      sort_order: index,

      is_primary: Boolean(image?.is_primary),
    }));

    /*
    =====================================================
    VALIDATE CLOUDINARY DATA
    =====================================================
    */

    const invalidImage = normalized.find(
      (image) =>
        !image.image_url ||
        !image.public_id
    );

    if (invalidImage) {
      return res.status(400).json({
        success: false,
        message:
          "Every image must contain image_url and public_id",
      });
    }

    /*
    =====================================================
    ENSURE ONE PRIMARY IMAGE
    =====================================================
    */

    if (normalized.length > 0) {
      let primaryFound = false;

      normalized.forEach((image) => {
        if (image.is_primary && !primaryFound) {
          primaryFound = true;
        } else {
          image.is_primary = false;
        }
      });

      if (!primaryFound) {
        normalized[0].is_primary = true;
      }
    }

    /*
    =====================================================
    GET OLD IMAGES
    =====================================================
    */

    const existingResult = await client.query(
      `
      SELECT public_id
      FROM product_images
      WHERE product_id = $1
      `,
      [Number(productId)]
    );

    const oldPublicIds = existingResult.rows
      .map((row) => row.public_id)
      .filter(Boolean);

    const retainedPublicIds = new Set(
      normalized.map((image) => image.public_id)
    );

    /*
    =====================================================
    START TRANSACTION
    =====================================================
    */

    await client.query("BEGIN");
    transactionStarted = true;

    /*
    =====================================================
    DELETE OLD DATABASE IMAGES
    =====================================================
    */

    await client.query(
      `
      DELETE FROM product_images
      WHERE product_id = $1
      `,
      [Number(productId)]
    );

    /*
    =====================================================
    INSERT CURRENT IMAGES
    =====================================================
    */

    for (let index = 0; index < normalized.length; index++) {
      const image = normalized[index];

      await client.query(
        `
        INSERT INTO product_images (
          product_id,
          image_url,
          public_id,
          alt_text,
          sort_order,
          is_primary
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        `,
        [
          Number(productId),
          image.image_url,
          image.public_id,
          image.alt_text,
          index,
          image.is_primary,
        ]
      );
    }

    /*
    =====================================================
    UPDATE MAIN PRODUCT IMAGE
    =====================================================
    */

    const primaryImage = normalized.find(
      (image) => image.is_primary
    );

    await client.query(
      `
      UPDATE products
      SET
        main_image_url = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [
        primaryImage?.image_url || null,
        Number(productId),
      ]
    );

    /*
    =====================================================
    COMMIT
    =====================================================
    */

    await client.query("COMMIT");
    transactionStarted = false;

    /*
    =====================================================
    DELETE REMOVED CLOUDINARY IMAGES
    =====================================================
    */

    const removedPublicIds = oldPublicIds.filter(
      (publicId) =>
        !retainedPublicIds.has(publicId)
    );

    await Promise.allSettled(
      removedPublicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        })
      )
    );

    /*
    =====================================================
    SUCCESS
    =====================================================
    */

    return res.json({
      success: true,
      message: "Product images updated successfully",

      images: normalized.map((image, index) => ({
        ...image,
        sort_order: index,
      })),

      main_image_url:
        primaryImage?.image_url || null,
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError.message
        );
      }
    }

    console.error(
      "Sync product images error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update product images",
    });
  } finally {
    client.release();
  }
}

/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  toggleProductStatus,
  getAdminProducts,
  getProductImageSignature,
  syncProductImages,
};