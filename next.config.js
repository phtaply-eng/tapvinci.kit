/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/student-card',
        destination: '/card',
        permanent: true,
      },
    ]
  },
}
module.exports = nextConfig