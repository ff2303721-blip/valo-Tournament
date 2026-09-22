import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,
    workerThreads: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
