import type {
  ApiFetch,
} from "../subjects/subjects.types";

import type {
  CreatePracticeSessionInput,
  QuestionBankWorkspace,
  QuestionFilters,
  QuestionListResponse,
  QuestionPracticeSession,
} from "./question-bank.types";

function queryString(
  filters: QuestionFilters,
): string {
  const params = new URLSearchParams();

  if (filters.subjectId) {
    params.set("subjectId", filters.subjectId);
  }

  if (filters.chapterId) {
    params.set("chapterId", filters.chapterId);
  }

  if (filters.topicId) {
    params.set("topicId", filters.topicId);
  }

  if (filters.difficulty) {
    params.set("difficulty", filters.difficulty);
  }

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.bookmarkedOnly) {
    params.set("bookmarkedOnly", "true");
  }

  params.set("limit", "100");

  return params.toString();
}

export function getQuestionBankWorkspace(
  apiFetch: ApiFetch,
) {
  return apiFetch<QuestionBankWorkspace>(
    "/question-bank/me",
  );
}

export function listQuestionBankQuestions(
  apiFetch: ApiFetch,
  filters: QuestionFilters,
) {
  return apiFetch<QuestionListResponse>(
    `/question-bank/questions?${queryString(filters)}`,
  );
}

export function bookmarkQuestion(
  apiFetch: ApiFetch,
  questionId: string,
) {
  return apiFetch<{
    bookmarked: true;
  }>(
    `/question-bank/bookmarks/${questionId}`,
    {
      method: "POST",
    },
  );
}

export function removeQuestionBookmark(
  apiFetch: ApiFetch,
  questionId: string,
) {
  return apiFetch<{
    bookmarked: false;
    questionId: string;
  }>(
    `/question-bank/bookmarks/${questionId}`,
    {
      method: "DELETE",
    },
  );
}

export function createPracticeSession(
  apiFetch: ApiFetch,
  input: CreatePracticeSessionInput,
) {
  return apiFetch<QuestionPracticeSession>(
    "/question-bank/practice-sessions",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getPracticeSession(
  apiFetch: ApiFetch,
  sessionId: string,
) {
  return apiFetch<QuestionPracticeSession>(
    `/question-bank/practice-sessions/${sessionId}`,
  );
}

export function answerPracticeItem(
  apiFetch: ApiFetch,
  sessionId: string,
  itemId: string,
  selectedOptionId: string,
  timeSpentSeconds: number,
) {
  return apiFetch<QuestionPracticeSession>(
    `/question-bank/practice-sessions/${sessionId}/items/${itemId}/answer`,
    {
      method: "PATCH",
      body: JSON.stringify({
        selectedOptionId,
        timeSpentSeconds,
      }),
    },
  );
}

export function completePracticeSession(
  apiFetch: ApiFetch,
  sessionId: string,
  durationSeconds: number,
) {
  return apiFetch<QuestionPracticeSession>(
    `/question-bank/practice-sessions/${sessionId}/complete`,
    {
      method: "PATCH",
      body: JSON.stringify({
        durationSeconds,
      }),
    },
  );
}
