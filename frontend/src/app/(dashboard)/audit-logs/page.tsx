"use client";

import { AuditLogsPage } from "@/features/audit-logs";
import { ProtectedRoute } from "@/shared/components/guard";

export default function Page() {
  return (
    <ProtectedRoute requiredPermission="audit_logs:read">
      <AuditLogsPage />
    </ProtectedRoute>
  );
}
