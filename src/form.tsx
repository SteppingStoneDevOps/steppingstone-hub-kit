import { cloneElement, isValidElement, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

/**
 * The edge of a text input, select or textarea (WCAG 1.4.11 Non-text Contrast, v0.22.0). The
 * border is the only thing that shows where the field is, so it needs 3:1 against the surface
 * around it and the fill inside it. `--color-border` (the card hairline) gives 1.15–1.49:1, so
 * fields mix `--color-muted` into it instead: 55% on dark (≥3.22:1 on bg, panel and panel-2),
 * 75% on light (≥3.16:1), the light theme being `[data-theme="light"]` as ThemeProvider sets it.
 * The light rule is wrapped in `:where()` so it carries one class's specificity: a `focus:`
 * border (the CRS fields' only focus cue) and a caller's className still win over it.
 * Built only from tokens every hub already defines; cards and dividers keep `border-border`.
 */
export const controlBorder =
  "border-[color-mix(in_srgb,var(--color-muted)_55%,var(--color-border))] [:where([data-theme=light])_&]:border-[color-mix(in_srgb,var(--color-muted)_75%,var(--color-border))]";

export const fieldBase =
  `w-full rounded-lg border ${controlBorder} bg-bg/60 px-3 text-sm text-fg placeholder:text-faint focus:border-brand/70 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand`;

export function Label({
  children,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-xs font-medium text-muted", className)}
    >
      {children}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-9", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(fieldBase, "py-2 resize-none", className)} {...props} />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(fieldBase, "h-9 appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-required"?: React.AriaAttributes["aria-required"];
};

/**
 * Label + control + optional hint/error. When the child is a single element (Input, Select,
 * Textarea or a raw control) the label is wired to it with a generated id, the hint and error
 * become its `aria-describedby`, and an error also sets `aria-invalid`. A child that carries its
 * own `id` keeps it; a fragment or multiple children render unchanged (no wiring).
 *
 * `required` marks the field the way WCAG 3.3.2 asks: an asterisk after the label text (hidden
 * from assistive tech, which gets the state from the control instead) and `aria-required` on the
 * wired control. Deliberately not the native `required` attribute: that raises the browser's own
 * validation bubble and bypasses the hub's inline `error`. A child's own `aria-required` wins;
 * unwired children get the label marker only. Show one `RequiredNote` above a form's first
 * required field so the asterisk is explained once.
 */
export function Field({
  label,
  children,
  hint,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  /** Validation message shown below the hint; also marks the control `aria-invalid`. */
  error?: string;
  /** Asterisk after the label and `aria-required` on the control (never the native attribute). */
  required?: boolean;
}) {
  const uid = useId();
  const hintId = hint ? `${uid}-hint` : undefined;
  const errorId = error ? `${uid}-error` : undefined;

  let control = children;
  let controlId: string | undefined;
  if (isValidElement<ControlProps>(children)) {
    controlId = children.props.id ?? uid;
    const describedBy =
      [children.props["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") ||
      undefined;
    control = cloneElement(children, {
      id: controlId,
      "aria-describedby": describedBy,
      "aria-invalid": error ? true : children.props["aria-invalid"],
      "aria-required": children.props["aria-required"] ?? (required ? true : undefined),
    });
  }

  return (
    <div className="mb-4">
      <Label htmlFor={controlId}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-indigo">
            *
          </span>
        )}
      </Label>
      {control}
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * "* Required", shown once above a form's first required `Field`. The asterisk is decorative
 * (aria-hidden); the word carries the meaning.
 */
export function RequiredNote({ className }: { className?: string }) {
  return (
    <p className={cn("mb-3 text-xs text-muted", className)}>
      <span aria-hidden="true">*</span> Required
    </p>
  );
}
