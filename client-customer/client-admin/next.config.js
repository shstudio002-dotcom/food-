/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable experimental turbopack root inference if it causes absolute path errors on Linux
  experimental: {
    turbopack: false,
  },
};

module.exports = nextConfig;