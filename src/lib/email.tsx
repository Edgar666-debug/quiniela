import { render } from "react-email";
import { Resend } from "resend";
import { InviteEmail } from "@/emails/invite-email";
import { OtpEmail } from "@/emails/otp-email";
import { VerificationEmail } from "@/emails/verification-email";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

async function sendEmail(props: {
  to: string;
  subject: string;
  react: ReturnType<typeof VerificationEmail> | ReturnType<typeof OtpEmail> | ReturnType<typeof InviteEmail>;
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

// Enviar email de enlace de verificación de cuenta
export async function sendVerificationLinkEmail(props: { email: string; name?: string | null; url: string }) {
  await sendEmail({
    to: props.email,
    subject: "Confirma tu cuenta de Quiniela",
    react: VerificationEmail({ name: props.name, verificationUrl: props.url }),
  });
}

// Enviar email de código de verificación de cuenta
export async function sendOtpEmail(props: { email: string; otp: string; type: string }) {
  const actionLabel = props.type === "sign-in" ? "sign in" : props.type.replaceAll("-", " ");

  await sendEmail({
    to: props.email,
    subject: `Tu código de Quiniela: ${props.otp}`,
    react: OtpEmail({ otp: props.otp, actionLabel }),
  });
}

// Enviar email de invitación a torneo
export async function sendInviteEmail(props: {
  email: string;
  tournamentName: string;
  inviterName?: string | null;
  token: string;
}) {
  const joinUrl = `${env.BETTER_AUTH_URL}/tournaments/join?token=${props.token}`;
  await sendEmail({
    to: props.email,
    subject: `Te invitaron a "${props.tournamentName}" en Quiniela`,
    react: InviteEmail({ tournamentName: props.tournamentName, inviterName: props.inviterName, joinUrl }),
  });
}
