import { cn } from "@/lib/cn";

export function Table({
  children,
  className,
  flush,
}: {
  children: React.ReactNode;
  className?: string;
  /** sem borda/cantos próprios — para usar dentro de um card */
  flush?: boolean;
}) {
  return (
    <div className={cn("overflow-x-auto bg-white", !flush && "rounded-xl border border-zinc-200", className)}>
      <table className="w-full text-[13px]">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-zinc-200 bg-zinc-50/60">{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  className,
  right,
}: {
  children?: React.ReactNode;
  className?: string;
  right?: boolean;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-2.5 py-2 text-left text-xs font-medium text-zinc-500",
        right && "text-right",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-zinc-100">{children}</tbody>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("group transition-colors hover:bg-zinc-50/60", className)}>{children}</tr>;
}

export function Td({
  children,
  className,
  right,
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  right?: boolean;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn("whitespace-nowrap px-2.5 py-2.5 align-middle", right && "text-right tabular-nums", className)}
    >
      {children}
    </td>
  );
}
