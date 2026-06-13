import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const apiFootballOrigin = process.env.API_FOOTBALL_BASE_URL
  ? new URL(process.env.API_FOOTBALL_BASE_URL).origin
  : "https://v3.football.api-sports.io";

const cspHeader = [
  "default-src 'self'",
  // 'unsafe-eval' required in dev for Next.js hot reload; Vercel Toolbar needs its own CDN in prod
  `script-src 'self' 'unsafe-inline' https://widgets.api-sports.io${isDev ? " 'unsafe-eval'" : " https://vercel.live https://*.vercel-scripts.com"}`,
  "style-src 'self' 'unsafe-inline' https://vercel.live",
  `img-src 'self' blob: data: https://media.api-sports.io https://vercel.live${supabaseHost ? ` https://${supabaseHost}` : ""}`,
  "font-src 'self' https://vercel.live",
  // Vercel Toolbar & Speed Insights use vercel.live / va.vercel-scripts.com
  `connect-src 'self' ${apiFootballOrigin} https://widgets.api-sports.io https://*.supabase.co wss://*.supabase.co https://vercel.live wss://ws-us3.pusher.com https://*.vercel-scripts.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        process.env.BETTER_AUTH_URL
          ? new URL(process.env.BETTER_AUTH_URL).host
          : "",
      ].filter(Boolean),
    },
  },
  images: {
    minimumCacheTTL: 2678400, // 31 days — team logos rarely change
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.api-sports.io",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
