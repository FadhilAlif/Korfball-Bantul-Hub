import { NAV_CONFIG } from "./Sidebar.constants";
import { isNavGroup } from "./Sidebar.types";

export const ALL_NAV_HREFS: string[] = NAV_CONFIG.flatMap((entry) =>
  isNavGroup(entry) ? entry.children.map((c) => c.href) : [entry.href],
);

/**
 * Determines whether a sidebar navigation item should be marked as active.
 * Handles prefix collisions (e.g., /stats vs /stats/me) by yielding to more specific
 * navigation items when the pathname matches both.
 */
export function isNavItemActive(itemHref: string, pathname: string, allHrefs: string[] = ALL_NAV_HREFS): boolean {
  if (itemHref === "/dashboard") {
    return pathname === "/dashboard";
  }

  // Exact match is always active
  if (pathname === itemHref) {
    return true;
  }

  // Subpath match (e.g., /matches/9/report matches /matches)
  if (pathname.startsWith(`${itemHref}/`)) {
    // If another nav item has an href that is a more specific (longer) match for this pathname,
    // this item yields so multiple items are not active simultaneously.
    const hasMoreSpecificMatch = allHrefs.some(
      (otherHref) =>
        otherHref !== itemHref &&
        otherHref.length > itemHref.length &&
        (pathname === otherHref || pathname.startsWith(`${otherHref}/`)),
    );
    return !hasMoreSpecificMatch;
  }

  return false;
}
