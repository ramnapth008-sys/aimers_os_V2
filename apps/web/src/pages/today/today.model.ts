import type { AcademicWorkspace } from "../subjects/subjects.types";
import type { PlannerWorkspace, StudyTask } from "../planner/planner.types";
import type { MockTestWorkspace } from "../mock-tests/mock-tests.types";
import type { PrivacyPreference } from "../settings/settings.types";

export interface TodayWorkspace {
  planner: PlannerWorkspace;
  academic: AcademicWorkspace | null;
  mockTests: MockTestWorkspace | null;
  privacy: PrivacyPreference | null;
  unavailable: string[];
}

export function localDateKey(value: string | Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function buildTodayModel(workspace: TodayWorkspace, now = new Date()) {
  const { planner, academic, mockTests } = workspace;
  const timeZone = planner.activity.timeZone;
  const today = localDateKey(now, timeZone);
  const dayOf = (value: string | null) =>
    value ? localDateKey(value, timeZone) : null;
  const activeSession =
    planner.sessions.find((session) => session.status === "ACTIVE") ?? null;
  const isDue = (task: StudyTask) =>
    Boolean(
      (task.scheduledFor && dayOf(task.scheduledFor)! <= today) ||
      (task.dueAt && dayOf(task.dueAt)! <= today) ||
      task.status === "IN_PROGRESS" ||
      task.id === activeSession?.studyTaskId,
    );
  const priority = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const rank = (task: StudyTask) => {
    if (task.id === activeSession?.studyTaskId) return 0;
    if (task.status === "IN_PROGRESS") return 1;
    if (task.dueAt && new Date(task.dueAt).getTime() < now.getTime()) return 2;
    if (isDue(task)) return 3;
    return 4;
  };
  const pending = planner.tasks.filter(
    (task) => task.status !== "CANCELLED" && task.status !== "COMPLETED",
  );
  const eligible = pending.filter(
    (task) => isDue(task) || (!task.scheduledFor && !task.dueAt),
  );
  const ordered = [...eligible].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      priority[a.priority] - priority[b.priority] ||
      a.sortOrder - b.sortOrder,
  );
  const completedToday = planner.tasks.filter(
    (task) => task.status === "COMPLETED" && dayOf(task.completedAt) === today,
  );
  const queue = [...ordered.filter(isDue), ...completedToday];
  const nextTask = ordered[0] ?? null;
  const chapters =
    academic?.syllabusVersion.subjects.flatMap((subject) =>
      subject.units.flatMap((unit) =>
        unit.chapters.map((chapter) => ({ subject, chapter })),
      ),
    ) ?? [];
  const nextChapter =
    chapters.find(
      ({ chapter }) =>
        academic?.chapterProgress.find(
          (progress) => progress.chapterId === chapter.id,
        )?.state === "IN_PROGRESS",
    ) ??
    chapters.find(
      ({ chapter }) =>
        !academic?.chapterProgress.some(
          (progress) =>
            progress.chapterId === chapter.id &&
            (progress.state === "COMPLETED" || progress.state === "SKIPPED"),
        ),
    ) ??
    null;
  const attempted =
    mockTests?.attempts.reduce(
      (sum, attempt) => sum + attempt.attemptedQuestions,
      0,
    ) ?? 0;
  const correct =
    mockTests?.attempts.reduce(
      (sum, attempt) => sum + attempt.correctAnswers,
      0,
    ) ?? 0;
  const accuracy =
    attempted > 0 ? Math.round((100 * correct) / attempted) : null;
  const progress = academic
    ? Math.max(
        0,
        Math.min(100, Math.round(academic.summary.chapterCompletionPercent)),
      )
    : null;
  const reviewTopic = academic?.topicMastery
    .filter(
      (topic) =>
        topic.nextReviewAt &&
        dayOf(topic.nextReviewAt)! <= today &&
        topic.attempts > 0,
    )
    .sort(
      (a, b) =>
        new Date(a.nextReviewAt!).getTime() -
        new Date(b.nextReviewAt!).getTime(),
    )[0];
  const reviewName = chapters
    .flatMap(({ chapter }) => chapter.topics)
    .find((topic) => topic.id === reviewTopic?.topicId)?.name;
  return {
    today,
    timeZone,
    activeSession,
    nextTask,
    nextChapter,
    queue,
    completedToday,
    attempted,
    accuracy,
    progress,
    reviewName,
  };
}
