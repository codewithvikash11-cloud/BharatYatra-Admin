/** @type {import('next').NextConfig} */
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: false, quiet: true });
const nextConfig = { transpilePackages: ['@bharatyatra/admin-auth'] };

module.exports = nextConfig;
