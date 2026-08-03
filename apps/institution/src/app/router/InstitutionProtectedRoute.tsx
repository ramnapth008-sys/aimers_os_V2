import {
  RequireAuth,
} from "@aimers/auth";

export function InstitutionProtectedRoute() {
  return (
    <RequireAuth
      roles={["INSTITUTION_ADMIN"]}
      loginUrl="/login"
    />
  );
}
