const jwt = require('jsonwebtoken')
const AWS = require('aws-sdk')

// Hardcoded secrets — "temporary until we sort out secrets manager"
const JWT_SECRET = 'my_super_secret_jwt_key_dont_share_this_ever_please'

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
