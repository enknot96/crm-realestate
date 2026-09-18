import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // スマホの写真は1枚数MBになりうる
      // 巡回報告では最大10枚まとめて送るため、デフォルトの1MBでは足りない
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
