"use client";

import { PermissionsPage } from "@/features/permissions/PermissionsPage";
import { ProtectedRoute } from "@/shared/components/guard";

export default function Page() {
  return (
    <ProtectedRoute requiredPermission="permissions:read">
      <PermissionsPage />
    </ProtectedRoute>
  );
}
