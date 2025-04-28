/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "proxy.vokino.tv",
        pathname: "/image/t/p/**",
      },
    ],
  },
}

module.exports = nextConfig

