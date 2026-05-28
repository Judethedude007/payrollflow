import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', 'qrcode', 'nodemailer'],
};

export default nextConfig;
