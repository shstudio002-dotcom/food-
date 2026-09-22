/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow your network IP connection to bypass cross-origin block
  allowedDevOrigins: ['192.168.56.1', 'localhost'],

  // Silence the workspace root multi-lockfile warning
  turbopack: {
    root: 'E:\\Food delivery system\\client-customer',
  },
}

module.exports = nextConfig;