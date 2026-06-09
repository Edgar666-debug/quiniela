type PageIntroProps = {
  title: string;
  description?: string;
  eyebrow?: React.ReactNode;
};

export function PageIntro(props: PageIntroProps) {
  return (
    <div className="space-y-1">
      {props.eyebrow ? <div className="text-muted-ui flex items-center gap-2">{props.eyebrow}</div> : null}
      <h1 className="text-2xl font-semibold">{props.title}</h1>
      {props.description ? <p className="text-muted-ui text-sm">{props.description}</p> : null}
    </div>
  );
}
