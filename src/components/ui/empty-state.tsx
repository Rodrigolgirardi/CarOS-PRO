import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/30 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 grid size-10 place-items-center rounded-full bg-zinc-100 text-zinc-400">
          <Icon size={18} strokeWidth={1.75} />
        </div>
      )}
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-zinc-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
