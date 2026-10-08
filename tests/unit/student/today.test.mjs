import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTodayModel,
  localDateKey,
} from "../../../apps/web/src/pages/today/today.model.ts";
import { getTodayWorkspace } from "../../../apps/web/src/pages/today/today.service.ts";
import {
  fixtureNow,
  makeStudentFixtures,
} from "../../fixtures/student-today.mjs";

test("calendar dates use the student timezone near midnight", () => {
  assert.equal(
    localDateKey("2026-10-07T20:00:00Z", "Asia/Kolkata"),
    "2026-10-08",
  );
  assert.equal(
    localDateKey("2026-10-07T20:00:00Z", "America/Los_Angeles"),
    "2026-10-07",
  );
});
test("cancelled and future urgent tasks do not become today’s next step", () => {
  const data = makeStudentFixtures();
  data.planner.tasks.unshift(
    {
      ...data.planner.tasks[0],
      id: "cancelled",
      status: "CANCELLED",
      priority: "URGENT",
    },
    {
      ...data.planner.tasks[0],
      id: "future",
      priority: "URGENT",
      scheduledFor: "2026-10-09T03:00:00Z",
      dueAt: "2026-10-09T04:00:00Z",
    },
  );
  const model = buildTodayModel(data, fixtureNow);
  assert.equal(model.nextTask.id, "task-1");
  assert.deepEqual(
    model.queue.map((task) => task.id),
    ["task-1", "task-2", "task-3"],
  );
});
test("an active session keeps its task ahead of overdue work", () => {
  const data = makeStudentFixtures();
  data.planner.tasks[0].dueAt = "2026-10-07T15:00:00Z";
  data.planner.sessions.push({
    id: "session",
    status: "ACTIVE",
    studyTaskId: "task-2",
    startedAt: "2026-10-08T04:55:00Z",
  });
  assert.equal(buildTodayModel(data, fixtureNow).nextTask.id, "task-2");
});
test("practice accuracy distinguishes missing evidence from a real zero", () => {
  const data = makeStudentFixtures();
  assert.equal(buildTodayModel(data, fixtureNow).accuracy, 75);
  data.mockTests.attempts[0].correctAnswers = 0;
  assert.equal(buildTodayModel(data, fixtureNow).accuracy, 0);
  data.mockTests.attempts = [];
  assert.equal(buildTodayModel(data, fixtureNow).accuracy, null);
  data.academic = null;
  assert.equal(buildTodayModel(data, fixtureNow).progress, null);
});
test("cancelled-only plans produce no false next task", () => {
  const data = makeStudentFixtures();
  data.planner.tasks = data.planner.tasks.map((task) => ({
    ...task,
    status: "CANCELLED",
  }));
  assert.equal(buildTodayModel(data, fixtureNow).nextTask, null);
});
test("one optional module failing preserves the live plan", async () => {
  const data = makeStudentFixtures();
  const result = await getTodayWorkspace(async (path) => {
    if (path === "/academic/me") throw new Error("Subjects offline");
    return {
      "/planner/me": data.planner,
      "/mock-tests/me": data.mockTests,
      "/privacy": data.privacy,
    }[path];
  });
  assert.equal(result.planner, data.planner);
  assert.equal(result.academic, null);
  assert.deepEqual(result.unavailable, ["subjects"]);
});
test("planner failures are surfaced instead of inventing a plan", async () => {
  await assert.rejects(
    getTodayWorkspace(async () => {
      throw new Error("Offline");
    }),
    /Offline/,
  );
});

test("completed-today counts actual completion, not a rescheduled old task", () => {
  const data = makeStudentFixtures();
  data.planner.tasks[2].completedAt = "2026-10-07T04:00:00Z";
  assert.equal(buildTodayModel(data, fixtureNow).completedToday.length, 0);
  data.planner.tasks[2].completedAt = "2026-10-08T04:00:00Z";
  assert.equal(buildTodayModel(data, fixtureNow).completedToday.length, 1);
});
