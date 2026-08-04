import type {
  ApiFetch,
} from "./mock-tests.types";

import type {
  MockTestRunnerAttempt,
  MockTestRunnerCatalogue,
  SaveRunnerResponseInput,
  SubmitRunnerAttemptInput,
} from "./mock-test-runner.types";

export function getMockTestRunnerCatalogue(
  apiFetch: ApiFetch,
) {
  return apiFetch<MockTestRunnerCatalogue>(
    "/mock-tests/runner/catalogue",
  );
}

export function startOrResumeMockTestRunnerAttempt(
  apiFetch: ApiFetch,
  mockTestId: string,
) {
  return apiFetch<MockTestRunnerAttempt>(
    `/mock-tests/${mockTestId}/runner-attempts`,
    {
      method: "POST",
    },
  );
}

export function getMockTestRunnerAttempt(
  apiFetch: ApiFetch,
  attemptId: string,
) {
  return apiFetch<MockTestRunnerAttempt>(
    `/mock-tests/runner-attempts/${attemptId}`,
  );
}

export function saveMockTestRunnerResponse(
  apiFetch: ApiFetch,
  attemptId: string,
  mockTestQuestionId: string,
  input:
    SaveRunnerResponseInput,
) {
  return apiFetch<MockTestRunnerAttempt>(
    `/mock-tests/runner-attempts/${attemptId}/responses/${mockTestQuestionId}`,
    {
      method: "PATCH",

      body:
        JSON.stringify(input),
    },
  );
}

export function submitMockTestRunnerAttempt(
  apiFetch: ApiFetch,
  attemptId: string,
  input:
    SubmitRunnerAttemptInput,
) {
  return apiFetch<MockTestRunnerAttempt>(
    `/mock-tests/runner-attempts/${attemptId}/submit`,
    {
      method: "PATCH",

      body:
        JSON.stringify(input),
    },
  );
}
