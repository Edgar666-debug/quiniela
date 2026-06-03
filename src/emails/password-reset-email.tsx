import { Section, Text } from "react-email";

import { EmailLayout } from "./components/email-layout";

export type PasswordResetEmailProps = {
  name?: string | null;
  resetUrl: string;
};

export function PasswordResetEmail(props: PasswordResetEmailProps) {
  const name = props.name?.trim() || "there";

  return (
    <EmailLayout
      preview="Restablece tu contraseña de Quiniela"
      title="Restablece tu contraseña"
      intro={`Hola ${name}, recibimos una solicitud para restablecer la contraseña de tu cuenta de Quiniela. Abre el siguiente enlace para elegir una nueva contraseña.`}
      actionLabel="Restablecer contraseña"
      actionUrl={props.resetUrl}
    >
      <Text style={helpText}>
        Si el botón no funciona, copia y pega este enlace en tu navegador:
      </Text>
      <Section style={urlBox}>
        <Text style={urlText}>{props.resetUrl}</Text>
      </Section>
      <Text style={footerText}>
        Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña
        actual seguirá siendo válida.
      </Text>
    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  name: "Edgar",
  resetUrl: "https://quiniela.example.com/reset-password?token=abc123",
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;

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

const footerText = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 0",
};
