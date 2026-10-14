/** @type {import('next').NextConfig} */
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: false, quiet: true });

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://bharat-yatra-in-bc-api.vercel.app/api/v1',
  },
};

module.exports = nextConfig;
