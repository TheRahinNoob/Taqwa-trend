/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://192.168.0.105:3000"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.0.105",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "prickly-land.localsite.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "taqwatrend.local",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;