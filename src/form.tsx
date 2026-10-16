import { cloneElement, isValidElement, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

export const fieldBase =
  "w-full rounded-lg border border-border bg-bg/60 px-3 text-sm text-fg placeholder:text-faint focus:border-brand/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand";

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
};

/**
 * Label + control + optional hint/error. When the child is a single element (Input, Select,
 * Textarea or a raw control) the label is wired to it with a generated id, the hint and error
 * become its `aria-describedby`, and an error also sets `aria-invalid`. A child that carries its
 * own `id` keeps it; a fragment or multiple children render unchanged (no wiring).
 */
export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  /** Validation message shown below the hint; also marks the control `aria-invalid`. */
  error?: string;
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
    });
  }

  return (
    <div className="mb-4">
      <Label htmlFor={controlId}>{label}</Label>
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
