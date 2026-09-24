"use client";

import { useSyncExternalStore } from "react";
import { SUPPORT_EMAIL, supportMailto, supportReference } from "./support";

/**
 * "Still stuck? Email support@…" plus the reference code, rendered under an `ErrorState` by the
 * error boundaries and nowhere else (see lib/support.ts for why a mailto, and why only here).
 * The address is real text as well as a link: a mailto is inert in a browser with no mail handler,
 * and the person must still be able to copy it. The route is read through `useSyncExternalStore`
 * so the server render (no window) and the client agree without a state update after mount.
 */
const subscribe = () => () => {};
const routeOnClient = () => window.location.pathname;
const routeOnServer = () => "";

export function SupportLine({ hub, digest }: { hub: string; digest?: string | null }) {
  const reference = supportReference(digest);
  const route = useSyncExternalStore(subscribe, routeOnClient, routeOnServer);
  const href = supportMailto({ hub, reference, route: route || null });

  return (
    <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-1.5 border-t border-border-soft pt-5 text-center text-sm text-muted">
      <p>
        Still stuck? Email{" "}
        <a
          href={href}
          className="font-semibold text-fg underline decoration-faint underline-offset-[3px] hover:decoration-fg"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
      {reference && (
        <p className="text-xs text-faint">
          Reference{" "}
          <code className="rounded-md bg-chip px-1.5 py-0.5 font-mono tracking-wide text-muted">
            {reference}
          </code>
        </p>
      )}
    </div>
  );
}
