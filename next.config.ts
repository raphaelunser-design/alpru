import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "www.haldenhof.at" },
      { protocol: "https", hostname: "img3.wallspic.com" },
      { protocol: "https", hostname: "www.skibasics.com" },
      { protocol: "https", hostname: "d1brno4kbxrfxy.cloudfront.net" },
      { protocol: "https", hostname: "s.w-x.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "imxplatform-cust-adac.fsn1.your-objectstorage.com" },
      { protocol: "https", hostname: "icons.duckduckgo.com" },
    ],
  },
};

export default nextConfig;
