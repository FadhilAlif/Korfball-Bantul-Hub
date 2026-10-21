"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, memo } from "react";
import { useBreadcrumbs } from "./useBreadcrumb";

export const Breadcrumb = memo(function Breadcrumb() {
  const items = useBreadcrumbs();

  return (
    <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const key = item.href ? `crumb-${item.href}` : `crumb-${item.label}`;

        return (
          <Fragment key={key}>
            {idx > 0 && <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
            {isLast || !item.href ? (
              <span
                className={`truncate ${
                  isLast ? "font-semibold text-foreground tracking-[-0.005em]" : "text-muted-foreground font-medium"
                }`}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors truncate"
              >
                {item.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
});
