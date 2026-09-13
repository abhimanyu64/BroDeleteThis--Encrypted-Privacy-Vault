const rateLimit = require('express-rate-limit');

// General API Rate Limiting: 120 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

// Upload Rate Limiting: Max 30 file uploads per hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload quota reached. Try again in an hour.' }
});

module.exports = {
  globalLimiter,
  uploadLimiter
};