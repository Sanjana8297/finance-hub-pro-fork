import { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

interface PublicSharedRouteProps {
  children: ReactNode;
  requiredRoles?: ("super_admin" | "admin" | "finance_manager" | "accountant" | "hr" | "employee" | "auditor")[];
}

/**
 * Route wrapper that allows public access when shared=true is in the URL,
 * otherwise requires authentication via ProtectedRoute
 */
export function PublicSharedRoute({ children, requiredRoles }: PublicSharedRouteProps) {
  const [searchParams] = useSearchParams();
  const isSharedMode = searchParams.get("shared") === "true";

  // If in shared mode, allow access without authentication
  if (isSharedMode) {
    return <>{children}</>;
  }

  // Otherwise, require authentication
  return (
    <ProtectedRoute requiredRoles={requiredRoles}>
      {children}
    </ProtectedRoute>
  );
}
