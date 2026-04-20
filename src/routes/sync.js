const express = require('express')
const router = express.Router()
const { verifyToken } = require('../auth')
const { query } = require('../db')

router.get('/jobs', verifyToken, async (req, res) => {
  const jobs = await query('SELECT * FROM sync_jobs WHERE user_id = $1', [req.user.userId])
  res.json(jobs.rows)
})

router.post('/jobs', verifyToken, async (req, res) => {
  const { name, schedule, destination } = req.body
  const result = await query(
    'INSERT INTO sync_jobs (name, schedule, destination, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, schedule, destination, req.user.userId]
  )
  res.json(result.rows[0])
})

module.exports = router
