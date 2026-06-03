import { Section, Text } from "react-email";

import { EmailLayout } from "@/emails/components/email-layout";

export type InviteEmailProps = {
  tournamentName: string;
  inviterName?: string | null;
  joinUrl: string;
};

export function InviteEmail(props: InviteEmailProps) {
  const inviter = props.inviterName?.trim() || "Un organizador";

  return (
    <EmailLayout
      preview={`Te invitaron a unirte a ${props.tournamentName}`}
      title="Tienes una invitación"
      intro={`${inviter} te invitó a participar en la quiniela "${props.tournamentName}". Haz clic en el botón para unirte.`}
      actionLabel="Unirme al torneo"
      actionUrl={props.joinUrl}
    >
      <Text style={helpText}>Si el botón no funciona, copia y pega este enlace en tu navegador:</Text>
      <Section style={urlBox}>
        <Text style={urlText}>{props.joinUrl}</Text>
      </Section>
    </EmailLayout>
  );
}

InviteEmail.PreviewProps = {
  tournamentName: "Liga MX Clausura 2026",
  inviterName: "Edgar",
  joinUrl: "https://quiniela-beige-one.vercel.app/tournaments/join?token=abc123",
} satisfies InviteEmailProps;

const helpText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px",
};

const urlBox = {
  backgroundColor: "#f8f5ee",
  border: "1px solid #e7dfd1",
  borderRadius: "12px",
  padding: "12px 14px",
};

const urlText = {
  color: "#8b5e34",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
  wordBreak: "break-all" as const,
};
