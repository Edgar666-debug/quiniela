import { Section, Text } from "react-email";

import { EmailLayout } from "@/emails/components/email-layout";

export type VerificationEmailProps = {
  name?: string | null;
  verificationUrl: string;
};

export function VerificationEmail(props: VerificationEmailProps) {
  const name = props.name?.trim() || "there";

  return (
    <EmailLayout
      preview="Confirma tu cuenta de Quiniela"
      title="Confirma tu email"
      intro={`Hola ${name}, abre el siguiente enlace para confirmar tu cuenta de Quiniela.`}
      actionLabel="Confirmar email"
      actionUrl={props.verificationUrl}
    >
      <Text style={helpText}>Si el botón no funciona, copia y pega este enlace en tu navegador:</Text>
      <Section style={urlBox}>
        <Text style={urlText}>{props.verificationUrl}</Text>
      </Section>
    </EmailLayout>
  );
}

VerificationEmail.PreviewProps = {
  name: "Edgar",
  verificationUrl: "https://quiniela.example.com/verify/token-123",
} satisfies VerificationEmailProps;

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

