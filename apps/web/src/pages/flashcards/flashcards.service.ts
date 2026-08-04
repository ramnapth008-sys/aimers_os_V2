import type {
  ApiFetch,
  CreateFlashcardReviewSessionInput,
  FlashcardReviewSession,
  FlashcardWorkspace,
  ReviewFlashcardInput,
} from "./flashcards.types";

export function getFlashcardWorkspace(
  apiFetch: ApiFetch,
): Promise<FlashcardWorkspace> {
  return apiFetch<FlashcardWorkspace>(
    "/flashcards/me",
  );
}

export function createFlashcardReviewSession(
  apiFetch: ApiFetch,
  input: CreateFlashcardReviewSessionInput,
): Promise<FlashcardReviewSession> {
  return apiFetch<FlashcardReviewSession>(
    "/flashcards/review-sessions",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getFlashcardReviewSession(
  apiFetch: ApiFetch,
  sessionId: string,
): Promise<FlashcardReviewSession> {
  return apiFetch<FlashcardReviewSession>(
    `/flashcards/review-sessions/${sessionId}`,
  );
}

export function reviewFlashcard(
  apiFetch: ApiFetch,
  sessionId: string,
  itemId: string,
  input: ReviewFlashcardInput,
): Promise<FlashcardReviewSession> {
  return apiFetch<FlashcardReviewSession>(
    `/flashcards/review-sessions/${sessionId}/items/${itemId}/review`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function completeFlashcardReviewSession(
  apiFetch: ApiFetch,
  sessionId: string,
  durationSeconds: number,
): Promise<FlashcardReviewSession> {
  return apiFetch<FlashcardReviewSession>(
    `/flashcards/review-sessions/${sessionId}/complete`,
    {
      method: "PATCH",
      body: JSON.stringify({
        durationSeconds,
      }),
    },
  );
}
