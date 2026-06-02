import { createHmac } from "node:crypto";

function base64UrlEncode(input: string | Uint8Array) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.from(input);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function signSupabaseJwt(payload: Record<string, unknown>, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerPart}.${payloadPart}`;
  const signature = createHmac("sha256", secret).update(data).digest();
  const signaturePart = base64UrlEncode(signature);
  return `${data}.${signaturePart}`;
}

