import type {
  ApiFetch,
  CompleteStudySessionInput,
  CreateStudyPlanInput,
  CreateStudyTaskInput,
  PlannerWorkspace,
  StudyPlan,
  StudySession,
  StudyTask,
  UpdateStudyTaskInput,
} from "./planner.types";

export function getPlannerWorkspace(
  apiFetch: ApiFetch,
): Promise<PlannerWorkspace> {
  return apiFetch<PlannerWorkspace>(
    "/planner/me",
  );
}

export function createStudyPlan(
  apiFetch: ApiFetch,
  input: CreateStudyPlanInput,
): Promise<StudyPlan> {
  return apiFetch<StudyPlan>(
    "/planner/plans",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function createStudyTask(
  apiFetch: ApiFetch,
  input: CreateStudyTaskInput,
): Promise<StudyTask> {
  return apiFetch<StudyTask>(
    "/planner/tasks",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateStudyTask(
  apiFetch: ApiFetch,
  taskId: string,
  input: UpdateStudyTaskInput,
): Promise<StudyTask> {
  return apiFetch<StudyTask>(
    `/planner/tasks/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteStudyTask(
  apiFetch: ApiFetch,
  taskId: string,
): Promise<{
  deleted: boolean;
  taskId: string;
}> {
  return apiFetch(
    `/planner/tasks/${taskId}`,
    {
      method: "DELETE",
    },
  );
}

export function startStudySession(
  apiFetch: ApiFetch,
  taskId: string,
): Promise<StudySession> {
  return apiFetch<StudySession>(
    `/planner/tasks/${taskId}/sessions/start`,
    {
      method: "POST",
    },
  );
}

export function completeStudySession(
  apiFetch: ApiFetch,
  sessionId: string,
  input: CompleteStudySessionInput = {},
): Promise<StudySession> {
  return apiFetch<StudySession>(
    `/planner/sessions/${sessionId}/complete`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}
