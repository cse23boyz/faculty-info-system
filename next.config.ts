// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for certificate uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // API body parser size
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;