const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

// =====================================================
// REGISTER
// =====================================================

async function register(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "");

    // -------------------------------------------------
    // Validation
    // -------------------------------------------------

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide either email or phone number",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // -------------------------------------------------
    // Email validation if provided
    // -------------------------------------------------

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // -------------------------------------------------
    // Phone validation if provided
    // -------------------------------------------------

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number",
      });
    }

    // -------------------------------------------------
    // Check existing user
    // -------------------------------------------------

    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE
        ($1 <> '' AND email = $1)
        OR
        ($2 <> '' AND phone = $2)
      LIMIT 1
      `,
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email or phone already exists",
      });
    }

    // -------------------------------------------------
    // Hash password
    // -------------------------------------------------

    const passwordHash = await bcrypt.hash(password, 12);

    // -------------------------------------------------
    // Create user
    // -------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO users
        (
          name,
          email,
          phone,
          password_hash
        )
      VALUES
        (
          $1,
          NULLIF($2, ''),
          NULLIF($3, ''),
          $4
        )
      RETURNING
        id,
        name,
        email,
        phone,
        role,
        is_active,
        created_at
      `,
      [
        name,
        email,
        phone,
        passwordHash,
      ]
    );

    const user = result.rows[0];

    // -------------------------------------------------
    // Create JWT
    // -------------------------------------------------

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("❌ Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
}

// =====================================================
// LOGIN
// =====================================================

async function login(req, res) {
  try {
    const identifier = String(req.body.identifier || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    // -------------------------------------------------
    // Validation
    // -------------------------------------------------

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/phone and password are required",
      });
    }

    // -------------------------------------------------
    // Find user
    // -------------------------------------------------

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        password_hash,
        role,
        is_active,
        created_at
      FROM users
      WHERE
        LOWER(email) = $1
        OR phone = $1
      LIMIT 1
      `,
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/phone or password",
      });
    }

    const user = result.rows[0];

    // -------------------------------------------------
    // Account status
    // -------------------------------------------------

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // -------------------------------------------------
    // Password verification
    // -------------------------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/phone or password",
      });
    }

    // -------------------------------------------------
    // Create JWT
    // -------------------------------------------------

    const token = createToken(user);

    // -------------------------------------------------
    // Remove sensitive field before response
    // -------------------------------------------------

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("❌ Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}

module.exports = {
  register,
  login,
};