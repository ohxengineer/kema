import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: let phones and tablets on the same Wi-Fi load the dev server's
  // scripts at this machine's LAN address. Update it if the IP changes.
  allowedDevOrigins: ["192.168.40.5"],
};

export default nextConfig;
