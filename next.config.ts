import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,
    workerThreads: true,
  },
};

export default nextConfig;
