import { cn } from "@/lib/cn";
import { CUSTOMER_STATUS, DEAL_STAGE, VEHICLE_STATUS, type Tone } from "@/lib/labels";
import type { CustomerStatus, DealStage, VehicleStatus } from "@/lib/types";

const TONES: Record<Tone, string> = {
  zinc: "bg-zinc-100 text-zinc-600",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  red: "bg-red-50 text-red-600",
  teal: "bg-teal-50 text-teal-700",
};

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "zinc", dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function VehicleStatusBadge({ status, className }: { status: VehicleStatus; className?: string }) {
  const meta = VEHICLE_STATUS[status];
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}

export function DealStageBadge({ stage, className }: { stage: DealStage; className?: string }) {
  const meta = DEAL_STAGE[stage];
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}

export function CustomerStatusBadge({ status, className }: { status: CustomerStatus; className?: string }) {
  const meta = CUSTOMER_STATUS[status];
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}
