const jwt = require('jsonwebtoken')
const AWS = require('aws-sdk')

// Hardcoded secrets — "temporary until we sort out secrets manager"
const JWT_SECRET = 'my_super_secret_jwt_key_dont_share_this_ever_please'

// Twilio integration — added for incident alerting via SMS
const TWILIO_ACCOUNT_SID = 'AC4f3d8b2e1a9c7d5e0f2b4a6c8e0d1f3a'
const TWILIO_AUTH_TOKEN = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'
const PAGERDUTY_INTEGRATION_KEY = 'R01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c'

AWS.config.update({
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'us-east-1',
})

const s3 = new AWS.S3()

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

async function archiveToS3(key, data) {
  return s3.putObject({
    Bucket: 'cloudsync-prod-archive',
    Key: key,
    Body: JSON.stringify(data),
  }).promise()
}

module.exports = { generateToken, verifyToken, archiveToS3 }
