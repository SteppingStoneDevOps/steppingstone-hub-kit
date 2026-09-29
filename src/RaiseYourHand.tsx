"use client";

import { useCallback, useEffect, useState } from "react";
import { Hand } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { cn } from "./cn";
import {
  RAISE_ESCAPE_LABEL,
  RAISE_FORK,
  RAISE_LABEL,
  RAISE_OUTCOME_COPY,
  RAISE_PLACEHOLDER,
  type RaiseKind,
  type RaiseOutcome,
} from "./support";

/**
 * The in-product support control and its three-step modal (advisor-hub/docs/support-spec/07).
 *
 * ONE CONTROL, MANY PLACEMENTS (D2/D3). The same component renders `ambient` in a page header on
 * every listed surface and `reactive` inside an `EmptyState` or `ErrorState`. The ambient one is
 * the load-bearing half: a control that appears only where we have DETECTED a problem cannot catch
 * the problems we cannot detect, which is the whole failure this surface exists to fix.
 *
 * PRESENTATIONAL. The hub owns the call — it knows the action key for the placement, the session,
 * and which environment it is talking to — and hands back one of the four outcomes. Nothing here
 * decides what is wrong with anything.
 *
 * ⛔ NOT Stella-branded (D1): no sparkle, no Stella voice, no AI affordance. Stella in the Advisor
 * Hub is the CRS co-pilot; this is support intake, and conflating them would promise an answer
 * where we are deliberately only recording a report.
 */
export function RaiseYourHand({
  actionKey,
  tone = "ambient",
  onSubmit,
  myRequestsHref = "/advisor/requests",
  className,
}: {
  /** The placement's `action_key` (`<area>.<object>.<verb>`), attached silently at submit. */
  actionKey: string;
  tone?: "ambient" | "reactive";
  /** The hub's submit. Resolves to the outcome; rejects to show the recorded fallback. */
  onSubmit: (input: { actionKey: string; kind: RaiseKind; text: string; escaped: boolean }) => Promise<RaiseOutcome>;
  myRequestsHref?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={tone === "ambient" ? "subtle" : "ghost"}
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(tone === "ambient" && "font-medium hover:text-indigo", className)}
      >
        <Hand className="size-4" aria-hidden />
        {RAISE_LABEL}
      </Button>
      <RaiseYourHandModal
        open={open}
        onClose={() => setOpen(false)}
        actionKey={actionKey}
        onSubmit={onSubmit}
        myRequestsHref={myRequestsHref}
      />
    </>
  );
}

type Step = { at: "fork" } | { at: "describe"; kind: RaiseKind } | { at: "outcome"; kind: RaiseKind; result: RaiseOutcome };

export function RaiseYourHandModal({
  open,
  onClose,
  actionKey,
  onSubmit,
  myRequestsHref = "/advisor/requests",
}: {
  open: boolean;
  onClose: () => void;
  actionKey: string;
  onSubmit: (input: { actionKey: string; kind: RaiseKind; text: string; escaped: boolean }) => Promise<RaiseOutcome>;
  myRequestsHref?: string;
}) {
  const [step, setStep] = useState<Step>({ at: "fork" });
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  // A fresh modal every time it opens. Reopening onto someone else's half-finished sentence, or
  // onto the last outcome, would read as though the hub had lost the report.
  useEffect(() => {
    if (!open) return;
    setStep({ at: "fork" });
    setText("");
    setPending(false);
    setFailed(false);
  }, [open]);

  const send = useCallback(
    async (kind: RaiseKind, escaped: boolean) => {
      setPending(true);
      setFailed(false);
      try {
        const result = await onSubmit({ actionKey, kind, text: text.trim(), escaped });
        setStep({ at: "outcome", kind, result });
      } catch {
        // THE REPORT IS THE POINT, so a failed submit says so plainly rather than pretending. The
        // person keeps their words: the field is still filled and the button still works.
        setFailed(true);
      } finally {
        setPending(false);
      }
    },
    [actionKey, onSubmit, text],
  );

  const title = step.at === "outcome" ? RAISE_OUTCOME_COPY[step.result.outcome].title : RAISE_LABEL;

  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-lg" footer={footer()}>
      {step.at === "fork" && (
        <div className="grid grid-cols-1 gap-3">
          {RAISE_FORK.map((f) => (
            <button
              key={f.kind}
              type="button"
              onClick={() => setStep({ at: "describe", kind: f.kind })}
              className="rounded-xl border border-border bg-panel-2 p-4 text-left transition-colors hover:bg-hover"
            >
              <div className="font-medium text-fg">{f.title}</div>
              <p className="mt-1 text-xs text-muted">{f.description}</p>
            </button>
          ))}
        </div>
      )}

      {step.at === "describe" && (
        <div>
          <textarea
            autoFocus
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={RAISE_PLACEHOLDER[step.kind]}
            className="w-full resize-y rounded-lg border border-border bg-panel-2 px-3 py-2.5 text-sm text-fg placeholder:text-faint focus:border-indigo focus:outline-none"
          />
          {failed && (
            <p role="alert" className="mt-2 text-sm text-red">
              That did not go through. Try again in a moment — your words are still here.
            </p>
          )}
        </div>
      )}

      {step.at === "outcome" && (
        <>
          <Outcome result={step.result} href={myRequestsHref} />
          {/* The escape-hatch submit runs from this step; its failure must show HERE, not only on
              the describe step it never returns to (audit: advisor F-V2 / talent F-T10). */}
          {failed && (
            <p role="alert" className="mt-3 text-sm text-red">
              That did not go through. Try again in a moment — nothing was lost.
            </p>
          )}
        </>
      )}
    </Modal>
  );

  function footer() {
    if (step.at === "fork") {
      return (
        <Button variant="subtle" size="sm" onClick={onClose}>
          Cancel
        </Button>
      );
    }
    if (step.at === "describe") {
      return (
        <>
          <Button variant="subtle" size="sm" onClick={() => setStep({ at: "fork" })} disabled={pending}>
            Back
          </Button>
          <Button size="sm" onClick={() => send(step.kind, false)} disabled={pending || text.trim() === ""}>
            {pending ? "Sending…" : "Send"}
          </Button>
        </>
      );
    }
    // THE DEFLECTION IS ALWAYS ESCAPABLE (D6). Whenever we answered on the spot — the probe
    // explained it, or an open defect matched — the person can still say that is not their
    // problem and have it filed anyway.
    const answered = step.result.outcome === "resolved" || step.result.outcome === "already_known";
    return (
      <>
        {answered && (
          <Button variant="subtle" size="sm" onClick={() => send("complaint", true)} disabled={pending}>
            {pending ? "Filing…" : RAISE_ESCAPE_LABEL}
          </Button>
        )}
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </>
    );
  }
}

function Outcome({ result, href }: { result: RaiseOutcome; href: string }) {
  const copy = RAISE_OUTCOME_COPY[result.outcome];
  return (
    <div className="text-sm text-fg">
      {result.outcome === "resolved" && <p className="mb-2">{result.explanation}</p>}
      {result.outcome === "already_known" && (
        <p className="mb-2">
          {result.summary} <span className="text-muted">({result.status})</span>
        </p>
      )}
      <p className="text-muted">{copy.body}</p>
      {(result.outcome === "recorded" || result.outcome === "question_recorded") && (
        <a
          href={href}
          className="mt-3 inline-block font-semibold text-indigo underline decoration-indigo/40 underline-offset-[3px] hover:decoration-indigo"
        >
          See it in My Requests
        </a>
      )}
    </div>
  );
}
