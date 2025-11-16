import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Help Turbopack choose the correct workspace root when multiple lockfiles exist
  turbopack: {
    root: __dirname,
  },
  // To silence the dev origin warning during LAN testing, set allowedDevOrigins to your LAN IP(s).
  // Uncomment and adjust as needed:
  // allowedDevOrigins: ["http://192.168.1.151:3000"],
};

export default nextConfig;
