import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",  // Changed from http to https
        hostname: "taskify-server-5gat.onrender.com",
        // Remove the port - Render uses default HTTPS port
        pathname: "/uploads/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;