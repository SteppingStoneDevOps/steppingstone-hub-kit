"use client";

import { useState } from "react";
import { cn } from "./cn";
import { fieldBase } from "./form";

/** The masked phone placeholder/format — US 10-digit. Platform phone standard
 *  (see memory: advisor-hub-phone-format-rule). */
export const PHONE_TEMPLATE = "(###) ###-####";

/**
 * Live-masking phone input. The user types up to 10 digits; the field builds
 * "(###) ###-####" as they go. Non-digits are ignored.
 */
function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  if (d.length > 6) return `(${a}) ${b}-${c}`;
  if (d.length > 3) return `(${a}) ${b}`;
  if (d.length > 0) return `(${a}`;
  return "";
}

/**
 * Controlled/uncontrolled hybrid. Pass `value` + `onValueChange` to read the masked value from the
 * parent (the case a React-state form needs). Omit both to keep the standalone-masking behaviour —
 * a native form field still submits its current value via FormData.
 */
export function PhoneInput({
  className,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  ...props
}: Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "defaultValue"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState(() => maskPhone(defaultValue));
  const value = isControlled ? maskPhone(controlledValue) : internal;
  return (
    <input
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      value={value}
      onChange={(e) => {
        const masked = maskPhone(e.target.value);
        if (!isControlled) setInternal(masked);
        onValueChange?.(masked);
      }}
      placeholder={PHONE_TEMPLATE}
      className={cn(fieldBase, "h-9", className)}
      {...props}
    />
  );
}
