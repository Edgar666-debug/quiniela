import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  // When using a tunnel (ngrok, Cloudflare Tunnel, etc.), add the public URL origin here.
  // Example:
  // trustedOrigins: ["http://localhost:3000", "https://your-subdomain.ngrok-free.app"],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  user: {
    changeEmail: {
      enabled: true,
      // While we don't have a real email provider yet, allow updating without verification
      // only when the current email isn't verified (Better Auth default behavior).
      updateEmailWithoutVerification: true,
    },
  },
  emailVerification: {
    async sendVerificationEmail({ user, url, token }) {
      // TODO: integrate a real email provider (Resend, SMTP, etc.).
      console.log(`[emailVerification] email=${user.email} token=${token} url=${url}`);
    },
  },
  emailAndPassword: { enabled: true },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // TODO: integrate a real email provider (Resend, SMTP, etc.).
        // For now, the OTP is logged for local/dev usage.
        console.log(`[emailOTP] type=${type} email=${email} otp=${otp}`);
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
