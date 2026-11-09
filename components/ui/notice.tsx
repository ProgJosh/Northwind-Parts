import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, InfoIcon } from "./icons";

type Tone = "info" | "success" | "warning" | "error";

const TONES: Record<Tone, string> = {
  info: "border-fjord/30 bg-fjord-soft text-ink",
  success: "border-ok/30 bg-ok-soft text-ok",
  warning: "border-warn/30 bg-warn-soft text-warn",
  error: "border-bad/30 bg-bad-soft text-bad",
};

const ICONS: Record<Tone, typeof InfoIcon> = {
  info: InfoIcon,
  success: CheckIcon,
  warning: AlertIcon,
  error: AlertIcon,
};

interface NoticeProps {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
  role?: "status" | "alert";
}

export function Notice({ tone = "info", title, children, className = "", role }: NoticeProps) {
  const Icon = ICONS[tone];
  return (
    <div role={role} className={`flex gap-3 rounded-md border p-4 text-sm ${TONES[tone]} ${className}`}>
      <Icon className="mt-0.5 shrink-0" />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-ink [&_a]:font-semibold [&_a]:underline">{children}</div>}
      </div>
    </div>
  );
}
