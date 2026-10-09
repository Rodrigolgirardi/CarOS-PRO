import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ title, description, actions, backHref, backLabel }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700"
          >
            <ArrowLeft size={12} />
            {backLabel ?? "Voltar"}
          </Link>
        )}
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
