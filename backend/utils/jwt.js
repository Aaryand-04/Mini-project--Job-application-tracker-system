const jwt = require('jsonwebtoken');

/**
 * Generate signed JWT token
 * @param {Object} payload - Data to embed in the token (e.g. { id, email, role })
 * @returns {string} - Signed JWT token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'fallback_dev_jwt_secret_987654321';
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token string
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'fallback_dev_jwt_secret_987654321';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken
};
