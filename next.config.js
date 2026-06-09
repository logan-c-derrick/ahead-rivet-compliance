/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-quill", "quill"],
  experimental: {
    staleTimes: {
      // Keep dynamic-route RSC payloads in the client router cache for 60s.
      // Navigate away and back within that window = instant, no server round-trip.
      dynamic: 60,
      static: 300,
    },
  },
};
module.exports = nextConfig;
