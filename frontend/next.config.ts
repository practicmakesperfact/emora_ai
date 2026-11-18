import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from all local network IPs during development.
  // Add any new network IP here if you switch networks.
  allowedDevOrigins: ["172.22.224.1", "172.24.64.1"],
};

export default nextConfig;
