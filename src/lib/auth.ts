import { passkey } from "@better-auth/passkey";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { sendOtpEmail, sendPasswordResetEmail, sendVerificationLinkEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function getTrustedOrigins() {
  const extras = (env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(/[,\n]/)
    .map((value: string) => value.trim())
    .filter(Boolean);

  return Array.from(new Set([env.BETTER_AUTH_URL, ...extras]));
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: getTrustedOrigins(),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
  },
  user: {
    changeEmail: {
      enabled: true,
    },
  },
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      await sendVerificationLinkEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
    sendOnSignIn: true,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail({ email, otp, type });
      },
    }),
    passkey({
      rpID: env.PASSKEY_RP_ID,
      rpName: env.PASSKEY_RP_NAME,
    }),
    // Keep nextCookies as the last plugin.
    nextCookies(),
  ],
  experimental: { joins: true },
});
