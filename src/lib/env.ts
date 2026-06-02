import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1),
    EMAIL_REPLY_TO: z.email().optional(),
    SUPABASE_JWT_SECRET: z.string().min(32),
    PASSKEY_RP_ID: z.string().min(1).default("localhost"),
    PASSKEY_RP_NAME: z.string().min(1).default("Quiniela"),
    API_FOOTBALL_KEY: z.string().min(1),
    API_FOOTBALL_BASE_URL: z.url().default("https://v3.football.api-sports.io"),
    CRON_SECRET: z.string().min(16),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    PASSKEY_RP_ID: process.env.PASSKEY_RP_ID,
    PASSKEY_RP_NAME: process.env.PASSKEY_RP_NAME,
    API_FOOTBALL_KEY: process.env.API_FOOTBALL_KEY,
    API_FOOTBALL_BASE_URL: process.env.API_FOOTBALL_BASE_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
});
