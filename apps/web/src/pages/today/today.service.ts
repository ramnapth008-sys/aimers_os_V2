import type { ApiFetch, PlannerWorkspace } from "../planner/planner.types";
import type { AcademicWorkspace } from "../subjects/subjects.types";
import type { MockTestWorkspace } from "../mock-tests/mock-tests.types";
import type { PrivacyPreference } from "../settings/settings.types";
import type { TodayWorkspace } from "./today.model";

export async function getTodayWorkspace(
  apiFetch: ApiFetch,
): Promise<TodayWorkspace> {
  const [planner, academic, mockTests, privacy] = await Promise.allSettled([
    apiFetch<PlannerWorkspace>("/planner/me", {
      signal: AbortSignal.timeout(15000),
    }),
    apiFetch<AcademicWorkspace>("/academic/me", {
      signal: AbortSignal.timeout(10000),
    }),
    apiFetch<MockTestWorkspace>("/mock-tests/me", {
      signal: AbortSignal.timeout(10000),
    }),
    apiFetch<PrivacyPreference>("/privacy", {
      signal: AbortSignal.timeout(10000),
    }),
  ]);
  if (planner.status === "rejected") throw planner.reason;
  return {
    planner: planner.value,
    academic: academic.status === "fulfilled" ? academic.value : null,
    mockTests: mockTests.status === "fulfilled" ? mockTests.value : null,
    privacy: privacy.status === "fulfilled" ? privacy.value : null,
    unavailable: [
      academic.status === "rejected" ? "subjects" : "",
      mockTests.status === "rejected" ? "test results" : "",
      privacy.status === "rejected" ? "tracking status" : "",
    ].filter(Boolean),
  };
}
