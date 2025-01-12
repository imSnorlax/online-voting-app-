const rateLimit = require('express-rate-limit');

// Rate Limiter for Registration Endpoint
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many accounts created from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
      success: false,
      message: 'Too many login attempts from this IP, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  module.exports = { registerLimiter, loginLimiter };
