#!/usr/bin/env node
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 9000;

// Store received webhooks for verification
const receivedWebhooks = [];

// Middleware to capture raw body for HMAC verification
app.use(bodyParser.json({
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', webhooksReceived: receivedWebhooks.length });
});

// Get all received webhooks
app.get('/webhooks', (req, res) => {
  res.json(receivedWebhooks);
});

// Clear webhooks
app.delete('/webhooks', (req, res) => {
  receivedWebhooks.length = 0;
  res.json({ message: 'Webhooks cleared' });
});

// Main webhook endpoint
app.post('/webhook', (req, res) => {
  console.log('\n=== Webhook Received ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Verify HMAC signature
  const signature = req.headers['x-forms-signature'];
  const timestamp = req.headers['x-forms-timestamp'];
  
  if (signature && timestamp) {
    // Extract the signature hash
    const signatureHash = signature.replace('sha256=', '');
    
    // Recreate the signature using the secret
    const secret = process.env.WEBHOOK_SECRET || 'test-webhook-secret';
    const payload = `${timestamp}.${req.rawBody}`;
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const isValid = signatureHash === expectedHash;
    console.log('Signature valid:', isValid);
    
    if (!isValid) {
      console.error('Invalid signature!');
      console.error('Expected:', expectedHash);
      console.error('Received:', signatureHash);
    }
  } else {
    console.log('No signature provided');
  }

  // Store the webhook
  const webhook = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
    signatureValid: signature ? true : false
  };
  
  receivedWebhooks.push(webhook);

  // Always respond with 200 OK
  res.status(200).json({ 
    message: 'Webhook received',
    id: webhook.id 
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🎣 Webhook receiver listening on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📬 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🔍 View webhooks: http://localhost:${PORT}/webhooks`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down webhook receiver...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down webhook receiver...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});