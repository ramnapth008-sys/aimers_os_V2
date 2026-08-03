import type {
  ApiFetch,
  StudentOnboardingInput,
  StudentOnboardingResult,
  StudentOnboardingStatus,
} from "./onboarding.types";

export function getStudentOnboardingStatus(
  apiFetch: ApiFetch,
): Promise<StudentOnboardingStatus> {
  return apiFetch<StudentOnboardingStatus>(
    "/onboarding/status",
  );
}

export function completeStudentOnboarding(
  apiFetch: ApiFetch,
  input: StudentOnboardingInput,
): Promise<StudentOnboardingResult> {
  return apiFetch<StudentOnboardingResult>(
    "/onboarding/student",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
