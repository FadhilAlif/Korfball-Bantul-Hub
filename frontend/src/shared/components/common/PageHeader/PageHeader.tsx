import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-[20px] sm:text-[22px] font-semibold tracking-tight break-words">{title}</h1>
        {description && <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="shrink-0 flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
