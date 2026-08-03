import type {
  AcademicWorkspace,
  ApiFetch,
  ChapterProgress,
  TopicMastery,
  UpdateChapterProgressInput,
  UpdateTopicMasteryInput,
} from "./subjects.types";

export function getAcademicWorkspace(
  apiFetch: ApiFetch,
): Promise<AcademicWorkspace> {
  return apiFetch<AcademicWorkspace>(
    "/academic/me",
  );
}

export function updateAcademicChapterProgress(
  apiFetch: ApiFetch,
  chapterId: string,
  input: UpdateChapterProgressInput,
): Promise<ChapterProgress> {
  return apiFetch<ChapterProgress>(
    `/academic/chapters/${chapterId}/progress`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function updateAcademicTopicMastery(
  apiFetch: ApiFetch,
  topicId: string,
  input: UpdateTopicMasteryInput,
): Promise<TopicMastery> {
  return apiFetch<TopicMastery>(
    `/academic/topics/${topicId}/mastery`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}
