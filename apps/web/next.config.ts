import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // K3S imajı: .next/standalone ile küçük runtime
};

export default nextConfig;
