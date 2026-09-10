import { InfoHint } from "./InfoHint";

export function PageHeader({
  title,
  action,
  info,
}: {
  title: string;
  action?: React.ReactNode;
  /** Optional guidance shown behind a hoverable (i) icon next to the title, replacing a subhead. */
  info?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-fg">
        {title}
        {info ? <InfoHint label={`About ${title}`}>{info}</InfoHint> : null}
      </h1>
      {action}
    </div>
  );
}
