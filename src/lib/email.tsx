import { render } from "react-email";
import { Resend } from "resend";

import { OtpEmail } from "@/emails/otp-email";
import { VerificationEmail } from "@/emails/verification-email";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

async function sendEmail(props: {
  to: string;
  subject: string;
  react: ReturnType<typeof VerificationEmail> | ReturnType<typeof OtpEmail>;
}) {
  const text = await render(props.react, { plainText: true });
  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [props.to],
    subject: props.subject,
    react: props.react,
    text,
    replyTo: env.EMAIL_REPLY_TO,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function sendVerificationLinkEmail(props: { email: string; name?: string | null; url: string }) {
  await sendEmail({
    to: props.email,
    subject: "Confirm your Quiniela account",
    react: VerificationEmail({ name: props.name, verificationUrl: props.url }),
  });
}

export async function sendOtpEmail(props: { email: string; otp: string; type: string }) {
  const actionLabel = props.type === "sign-in" ? "sign in" : props.type.replaceAll("-", " ");

  await sendEmail({
    to: props.email,
    subject: `Your Quiniela code: ${props.otp}`,
    react: OtpEmail({ otp: props.otp, actionLabel }),
  });
}
