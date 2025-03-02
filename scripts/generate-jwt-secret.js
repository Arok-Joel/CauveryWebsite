#!/usr/bin/env node

/**
 * This script generates a secure random string to use as JWT_SECRET
 * Run with: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate a secure random string of 64 bytes (512 bits) and encode as base64
const jwtSecret = crypto.randomBytes(64).toString('base64');

console.log('Generated JWT_SECRET:');
console.log(jwtSecret);
console.log('\nAdd this to your Netlify environment variables as JWT_SECRET'); 