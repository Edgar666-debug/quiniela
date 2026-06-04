import { ResetPasswordForm } from "./reset-password-form";

export const metadata = {
  title: "Restablecer contraseña",
};

export default async function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await props.searchParams;
  return <ResetPasswordForm token={token} />;
}
