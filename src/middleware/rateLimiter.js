const rateLimit = require('express-rate-limit');

/**
 * Limiter for sensitive routes like login and register to prevent brute-force attacks.
 * Allows 5 requests per 15 minutes per IP.
 */
const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { sensitiveLimiter };
