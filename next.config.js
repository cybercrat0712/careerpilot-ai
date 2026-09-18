/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["playwright", "playwright-extra"]
  }
};

module.exports = nextConfig;
