
import 'dotenv/config'; // Charge .env en local
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log({
  Environment: process.env.NODE_ENV,
  Database_URL: process.env.DATABASE_URL
})
//console.log(`Environment: ${process.env.NODE_ENV}, Database URL: ${process.env.DATABASE_URL}`);

export default pool;
