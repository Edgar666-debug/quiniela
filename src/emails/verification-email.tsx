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
      preview="Confirm your Quiniela account"
      title="Confirm your email"
      intro={`Hi ${name}, open the link below to confirm your Quiniela account.`}
      actionLabel="Confirm email"
      actionUrl={props.verificationUrl}
    >
      <Text style={helpText}>If the button does not work, copy and paste this URL into your browser:</Text>
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

