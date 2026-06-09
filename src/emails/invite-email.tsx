import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";

export type InviteEmailProps = {
  tournamentName: string;
  tournamentLogoUrl?: string | null;
  inviterName?: string | null;
  joinUrl: string;
};

export function InviteEmail(props: InviteEmailProps) {
  const inviter = props.inviterName?.trim() || "Un organizador";

  return (
    <Html lang="es">
      <Head />
      <Preview>{inviter} te invitó a la quiniela &quot;{props.tournamentName}&quot; — únete ahora</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Hero card */}
          <Section style={card}>
            {/* Invitation message */}
            <Text style={eyebrow}>INVITACIÓN</Text>
            <Text style={title}>¡{inviter} te invitó!</Text>
            <Text style={paragraph}>
              <strong>{inviter}</strong> te ha invitado a unirte a la quiniela{" "}
              <strong>&quot;{props.tournamentName}&quot;</strong>. Haz tus picks, compite
              con amigos y sigue el ranking en vivo.
            </Text>

            {/* Tournament logo */}
              <Section style={heroSection}>
              {props.tournamentLogoUrl ? (
                <Img
                  src={props.tournamentLogoUrl}
                  alt={props.tournamentName}
                  width="140"
                  height="140"
                  style={logoImage}
                />
              ) : (
                <Section style={logoFallback}>
                  <Text style={logoFallbackText}>🏆</Text>
                </Section>
              )}
            </Section>

            {/* CTA */}
            <Section style={buttonRow}>
              <Button href={props.joinUrl} style={button}>
                Unirme al torneo →
              </Button>
            </Section>

            {/* Feature pills */}
            <Section style={pillsRow}>
              <Text style={pill}>🎯 Picks 1X2</Text>
              <Text style={pill}>📊 Ranking en vivo</Text>
              <Text style={pill}>🔒 Por invitación</Text>
            </Section>

            <Hr style={divider} />

            {/* Fallback URL */}
            <Text style={helpText}>
              Si el botón no funciona, copia y pega este enlace en tu
              navegador:
            </Text>
            <Section style={urlBox}>
              <Text style={urlText}>{props.joinUrl}</Text>
            </Section>

            <Hr style={divider} />

            <Text style={footerText}>
              Si no esperabas esta invitación, puedes ignorar este mensaje con
              seguridad.
            </Text>
          </Section>

          {/* Footer */}
          <Text style={outerFooter}>
            © 2026 Quiniela · Hecho para jugar entre amigos
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

InviteEmail.PreviewProps = {
  tournamentName: "Liga MX Clausura 2026",
  tournamentLogoUrl:
    "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=144&q=80",
  inviterName: "Edgar",
  joinUrl: "https://quiniela-beige-one.vercel.app/tournaments/join?token=abc123",
} satisfies InviteEmailProps;

export default InviteEmail;

/* ── Styles ────────────────────────────────────────────────── */

const body = {
  backgroundColor: "#f1f0eb",
  fontFamily: "Arial, Helvetica, sans-serif",
  margin: "0",
  padding: "32px 12px",
};

const container = {
  margin: "0 auto",
  maxWidth: "560px",
};

const card = {
  backgroundColor: "#fffdf8",
  border: "1px solid #e4ddd2",
  borderRadius: "20px",
  padding: "32px",
};

/* Hero */
const heroSection = {
  backgroundColor: "#f5f0e8",
  borderRadius: "14px",
  marginBottom: "28px",
  padding: "28px 20px 20px",
  textAlign: "center" as const,
};

const logoImage = {
  borderRadius: "24px",
  display: "inline-block",
  marginBottom: "14px",
  objectFit: "cover" as const,
  boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
};

const logoFallback = {
  backgroundColor: "#f0ebe3",
  borderRadius: "24px",
  display: "inline-block",
  height: "140px",
  margin: "0 auto 14px",
  textAlign: "center" as const,
  width: "140px",
};

const logoFallbackText = {
  fontSize: "60px",
  lineHeight: "140px",
  margin: "0",
};

/* Content */
const eyebrow = {
  color: "#a07850",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.14em",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const title = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "800",
  lineHeight: "36px",
  margin: "0 0 14px",
};

const paragraph = {
  color: "#4b4b4b",
  fontSize: "15px",
  lineHeight: "25px",
  margin: "0 0 8px",
};

/* Button */
const buttonRow = {
  margin: "28px 0 20px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#1a1a1a",
  borderRadius: "12px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 24px",
  textDecoration: "none",
};

/* Feature pills */
const pillsRow = {
  margin: "0 0 4px",
  textAlign: "center" as const,
};

const pill = {
  backgroundColor: "#f5f0e8",
  border: "1px solid #e4ddd2",
  borderRadius: "999px",
  color: "#6b5e4b",
  display: "inline-block",
  fontSize: "12px",
  fontWeight: "600",
  lineHeight: "1",
  margin: "0 6px 8px 0",
  padding: "5px 11px",
};

/* URL fallback */
const divider = {
  borderColor: "#e4ddd2",
  margin: "20px 0",
};

const helpText = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "21px",
  margin: "0 0 10px",
};

const urlBox = {
  backgroundColor: "#f5f0e8",
  border: "1px solid #e4ddd2",
  borderRadius: "10px",
  padding: "12px 14px",
  textAlign: "center" as const,
};

const urlText = {
  color: "#8b6340",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0",
  wordBreak: "break-all" as const,
};

/* Footer */
const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0",
  textAlign: "center" as const,
};

const outerFooter = {
  color: "#a09080",
  fontSize: "12px",
  margin: "20px 0 0",
  textAlign: "center" as const,
  textTransform: "uppercase" as const,
};
