-- ============================================
-- HOME FOODS DATABASE
-- PRODUCT FOUNDATION
-- ============================================

-- ============================================
-- 1. USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) UNIQUE,

    phone VARCHAR(15) UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'customer'
        CHECK (role IN ('customer', 'admin')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- 2. CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    slug VARCHAR(120) NOT NULL UNIQUE,

    description TEXT,

    parent_id BIGINT REFERENCES categories(id)
        ON DELETE SET NULL,

    food_type VARCHAR(20)
        CHECK (food_type IN ('veg', 'non_veg', 'mixed')),

    image_url TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- 3. PRODUCTS
-- ============================================

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,

    category_id BIGINT NOT NULL
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    name VARCHAR(200) NOT NULL,

    slug VARCHAR(220) NOT NULL UNIQUE,

    short_description VARCHAR(500),

    description TEXT,

    ingredients TEXT,

    food_type VARCHAR(20) NOT NULL
        CHECK (food_type IN ('veg', 'non_veg')),

    main_image_url TEXT,

    rating NUMERIC(2,1) NOT NULL DEFAULT 0
        CHECK (rating >= 0 AND rating <= 5),

    review_count INTEGER NOT NULL DEFAULT 0
        CHECK (review_count >= 0),

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- 4. PRODUCT VARIANTS
-- ============================================

CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,

    product_id BIGINT NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    label VARCHAR(50) NOT NULL,

    weight_grams INTEGER,

    price NUMERIC(10,2) NOT NULL
        CHECK (price >= 0),

    original_price NUMERIC(10,2)
        CHECK (original_price >= 0),

    stock_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (stock_quantity >= 0),

    sku VARCHAR(100) UNIQUE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(product_id, label)
);


-- ============================================
-- 5. PRODUCT IMAGES
-- ============================================

CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,

    product_id BIGINT NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    image_url TEXT NOT NULL,

    alt_text VARCHAR(255),

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_parent_id
ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_active
ON categories(is_active);

CREATE INDEX IF NOT EXISTS idx_products_category_id
ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_food_type
ON products(food_type);

CREATE INDEX IF NOT EXISTS idx_products_active
ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_products_featured
ON products(is_featured);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
ON product_images(product_id);