const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not defined in environment variables.");
}

const pool = new Pool({
  connectionString: databaseUrl,

  // Neon/PostgreSQL SSL
  ssl: databaseUrl?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL database connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err.message);
});

module.exports = pool;