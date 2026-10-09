import { cn } from "@/lib/cn";

export const controlCls =
  "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-base lg:h-8 lg:px-2.5 lg:text-[13px] text-zinc-900 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 disabled:bg-zinc-50 disabled:text-zinc-400";

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, required, hint, className, children }: FieldProps) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">
        {label}
        {required && <span className="text-zinc-400"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-400">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlCls, className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={cn(controlCls, "appearance-none pr-7 bg-[length:14px] bg-[right_8px_center] bg-no-repeat", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2371717a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(controlCls, "h-auto min-h-[72px] py-2", className)} {...props} />;
}
