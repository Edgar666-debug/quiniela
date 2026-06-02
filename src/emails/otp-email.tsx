import { Section, Text } from "react-email";

import { EmailLayout } from "@/emails/components/email-layout";

export type OtpEmailProps = {
  otp: string;
  actionLabel: string;
};

export function OtpEmail(props: OtpEmailProps) {
  return (
    <EmailLayout
      preview={`Your Quiniela code: ${props.otp}`}
      title="Your verification code"
      intro={`Use this code to ${props.actionLabel}.`}
    >
      <Section style={otpBox}>
        <Text style={otpText}>{props.otp}</Text>
      </Section>
    </EmailLayout>
  );
}

OtpEmail.PreviewProps = {
  otp: "482913",
  actionLabel: "sign in",
} satisfies OtpEmailProps;

const otpBox = {
  backgroundColor: "#111827",
  borderRadius: "14px",
  margin: "20px 0 8px",
  padding: "18px 20px",
};

const otpText = {
  color: "#ffffff",
  fontSize: "30px",
  fontWeight: "700",
  letterSpacing: "0.22em",
  lineHeight: "38px",
  margin: "0",
  textAlign: "center" as const,
};

