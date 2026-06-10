import { InlineAlert } from "@/components/app/inline-alert";

export function FeedbackAlerts(props: {
  message?: string | null;
  error?: string | null;
  className?: string;
}) {
  return (
    <>
      {props.message ? <InlineAlert variant="success" message={props.message} className={props.className} /> : null}
      {props.error ? <InlineAlert variant="error" message={props.error} className={props.className} /> : null}
    </>
  );
}
