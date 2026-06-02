import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

type EmailLayoutProps = {
  preview: string;
  title: string;
  intro: string;
  actionLabel?: string;
  actionUrl?: string;
  children?: React.ReactNode;
  footer?: string;
};

export function EmailLayout(props: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{props.preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={card}>
            <Text style={eyebrow}>QUINIELA</Text>
            <Text style={title}>{props.title}</Text>
            <Text style={paragraph}>{props.intro}</Text>
            {props.actionLabel && props.actionUrl ? (
              <Section style={buttonRow}>
                <Button href={props.actionUrl} style={button}>
                  {props.actionLabel}
                </Button>
              </Section>
            ) : null}
            {props.children}
            <Hr style={divider} />
            <Text style={footer}>{props.footer ?? "If you did not request this email, you can safely ignore it."}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f4f4ef",
  fontFamily: 'Arial, Helvetica, sans-serif',
  margin: "0",
  padding: "24px 12px",
};

const container = {
  margin: "0 auto",
  maxWidth: "560px",
};

const card = {
  backgroundColor: "#fffdf8",
  border: "1px solid #e7dfd1",
  borderRadius: "18px",
  padding: "32px",
};

const eyebrow = {
  color: "#8b5e34",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.12em",
  margin: "0 0 12px",
};

const title = {
  color: "#1f2937",
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "36px",
  margin: "0 0 16px",
};

const paragraph = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const buttonRow = {
  margin: "24px 0",
};

const button = {
  backgroundColor: "#111827",
  borderRadius: "12px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 20px",
  textDecoration: "none",
};

const divider = {
  borderColor: "#e7dfd1",
  margin: "24px 0 16px",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "22px",
  margin: "0",
};

