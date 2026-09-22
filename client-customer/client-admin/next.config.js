/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['192.168.56.1', 'localhost:3001'],
};

module.exports = nextConfig;