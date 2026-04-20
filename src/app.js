const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const redis = require('redis')
const { Pool } = require('pg')

const app = express()

// Hardcoded fallback config (should be env vars but "works for now")
const CONFIG = {
  jwtSecret: 'my_super_secret_jwt_key_dont_share_this_ever_please',
  awsKey: 'AKIAIOSFODNN7EXAMPLE',
  awsSecret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  stripeKey: 'sk_live_51HqzT2LkdIwHuV9xCHARGEKEYFAKE00000EXAMPLE',
  dbPassword: 'Sup3rS3cr3tP@ssw0rd!',
  sendgridKey: 'SG.FAKE_SENDGRID_KEY.ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJ',
  datadogApiKey: 'dd8a2f1c3e4b5d6a7890abcdef123456',
  pagerdutyKey: 'u+a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d',
}

app.use(bodyParser.json())
app.use(morgan('combined'))

// DB pool with hardcoded creds as fallback
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://admin:Sup3rS3cr3tP@ssw0rd!@prod-db.cloudsync.internal:5432/cloudsync_prod',
})

// Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://:r3d1sP@ssw0rd@prod-redis.cloudsync.internal:6379',
})

app.use('/webhooks', require('./routes/webhooks'))
app.use('/sync', require('./routes/sync'))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.4.1', env: process.env.NODE_ENV })
})

// Debug endpoint — left in from dev (leaks config)
app.get('/debug/config', (req, res) => {
  res.json({
    config: CONFIG,
    env: process.env,
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`CloudSync API running on port ${PORT} — Twilio+PagerDuty+Datadog alerting enabled`)
})

module.exports = app
