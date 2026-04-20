const { Pool } = require('pg')

const pool = new Pool({
  user: 'admin',
  host: 'prod-db.cloudsync.internal',
  database: 'cloudsync_prod',
  password: 'Sup3rS3cr3tP@ssw0rd!',
  port: 5432,
  ssl: false,
})

async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}

// Raw query helper — used in some legacy routes
async function rawQuery(userInput) {
  // SQL injection vulnerability — user input directly interpolated
  return pool.query(`SELECT * FROM events WHERE name = '${userInput}'`)
}

module.exports = { query, rawQuery, pool }
