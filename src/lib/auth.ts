import { passkey } from "@better-auth/passkey";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { sendOtpEmail, sendVerificationLinkEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  user: {
    changeEmail: {
      enabled: true,
      // Keep the current behavior until a full change-email verification flow is added.
      updateEmailWithoutVerification: true,
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
  },
  emailAndPassword: { enabled: true },
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
