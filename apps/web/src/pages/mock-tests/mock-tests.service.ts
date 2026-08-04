import type {
  ApiFetch,
  MockTest,
  MockTestAttempt,
  MockTestWorkspace,
  RecordMockTestAttemptInput,
} from "./mock-tests.types";

export function getMockTestWorkspace(
  apiFetch: ApiFetch,
): Promise<MockTestWorkspace> {
  return apiFetch<MockTestWorkspace>(
    "/mock-tests/me",
  );
}

export function getMockTest(
  apiFetch: ApiFetch,
  mockTestId: string,
): Promise<MockTest> {
  return apiFetch<MockTest>(
    `/mock-tests/${mockTestId}`,
  );
}

export function recordMockTestAttempt(
  apiFetch: ApiFetch,
  mockTestId: string,
  input: RecordMockTestAttemptInput,
): Promise<MockTestAttempt> {
  return apiFetch<MockTestAttempt>(
    `/mock-tests/${mockTestId}/attempts`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function deleteMockTestAttempt(
  apiFetch: ApiFetch,
  attemptId: string,
): Promise<{
  deleted: boolean;
  attemptId: string;
}> {
  return apiFetch(
    `/mock-tests/attempts/${attemptId}`,
    {
      method: "DELETE",
    },
  );
}
