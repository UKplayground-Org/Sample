const express = require('express')
const router = express.Router()
const stripe = require('stripe')('sk_live_51HqzT2LkdIwHuV9xCHARGEKEYFAKE00000EXAMPLE')
const { rawQuery } = require('../db')

// Stripe webhook handler
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, 'whsec_FAKEwebhookSecret123456789')
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await rawQuery(event.data.object.metadata.orderId)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({ received: true })
})

// Slack event handler
router.post('/slack', async (req, res) => {
  const SLACK_TOKEN = 'xoxb-FAKE-SLACK-TOKEN-123456789012-ABCDEFGHIJKLMNOPQRSTUVWX'
  console.log('Slack event received, token:', SLACK_TOKEN)
  res.json({ ok: true })
})

module.exports = router
