import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  fixtureNow,
  makeStudentFixtures,
} from "../../fixtures/student-today.mjs";

// Runs against the actual Vite app with explicit synthetic API responses.
const playwrightImport = process.env.AIMERS_PLAYWRIGHT_MODULE;
const { chromium } = await import(
  playwrightImport ? pathToFileURL(playwrightImport).href : "playwright"
);
const baseUrl = process.env.AIMERS_UI_URL ?? "http://127.0.0.1:5173";
const outputDir = resolve(
  process.env.AIMERS_UI_OUTPUT ?? "test-results/student-ui",
);
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
let checks = 0;

async function openStudent(width, height, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    timezoneId: "Asia/Kolkata",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install({ time: fixtureNow });
  const data = makeStudentFixtures();
  const calls = [];
  if (options.empty) {
    data.planner.tasks = [];
    data.mockTests.attempts = [];
  }
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname.replace("/api/v1", "");
    calls.push({ endpoint, method: request.method() });
    const headers = {
      "access-control-allow-origin": new URL(baseUrl).origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization,content-type",
      "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    };
    if (request.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    const respond = (body, status = 200) =>
      route.fulfill({
        status,
        headers,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (endpoint === "/auth/refresh")
      return respond({
        accessToken: "synthetic-test-session",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: "preview-student",
          email: "student@example.test",
          firstName: "Ram",
          lastName: null,
          displayName: "Ram",
          status: "ACTIVE",
          roles: ["STUDENT"],
          organizationMemberships: [],
        },
      });
    if (endpoint === "/onboarding/status") return respond({ completed: true });
    if (endpoint === "/privacy-agreement")
      return respond({ accepted: true, required: false });
    if (endpoint === "/consent") return respond({ grants: [] });
    if (endpoint === "/privacy") return respond(data.privacy);
    if (endpoint === "/devices") return respond({ devices: [] });
    if (endpoint === "/devices/connectors/all")
      return respond({ connectors: [] });
    if (endpoint === "/connector-setup")
      return respond({
        summary: { setupComplete: true, connected: 0, total: 0 },
      });
    if (endpoint === "/academic/me")
      return options.partial
        ? respond({ message: "Subjects offline" }, 503)
        : respond(data.academic);
    if (endpoint === "/mock-tests/me") return respond(data.mockTests);
    if (endpoint === "/planner/me")
      return options.offline
        ? respond({ message: "Planner offline" }, 503)
        : respond(data.planner);
    if (endpoint.endsWith("/sessions/start")) {
      if (options.failSession)
        return respond({ message: "Session could not be started" }, 503);
      const taskId = endpoint.split("/")[3];
      const studyTask = data.planner.tasks.find((task) => task.id === taskId);
      assert.ok(studyTask, "Started task belongs to the displayed queue");
      studyTask.status = "IN_PROGRESS";
      const session = {
        id: "session-test",
        studyTaskId: taskId,
        studyTask,
        status: "ACTIVE",
        startedAt: fixtureNow.toISOString(),
        plannedMinutes: studyTask.estimatedMinutes,
        durationMinutes: 0,
        focusMinutes: 0,
      };
      data.planner.sessions = [session];
      data.planner.activity.activeSessionId = session.id;
      return respond(session);
    }
    if (endpoint === "/planner/sessions/session-test/complete") {
      const session = data.planner.sessions[0];
      session.status = "COMPLETED";
      session.durationMinutes = 1;
      session.focusMinutes = 1;
      data.planner.activity.activeSessionId = null;
      data.planner.activity.todayMinutes += 1;
      return respond(session);
    }
    return respond({ message: `Unmocked test endpoint: ${endpoint}` }, 404);
  });
  await page.goto(`${baseUrl}/dashboard`);
  const heading = page.getByRole("heading", {
    name: "A little progress, every day.",
  });
  if (options.offline)
    await page
      .getByRole("heading", { name: "Let’s reconnect your study plan." })
      .waitFor();
  else await heading.waitFor();
  return { context, page, data, errors, calls };
}

async function check(name, action) {
  try {
    await action();
    checks++;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}: ${error.stack}`);
  }
}

try {
  for (const [name, width, height] of [
    ["desktop", 1440, 1060],
    ["laptop", 1024, 900],
    ["tablet", 768, 1024],
    ["mobile", 390, 844],
    ["small-mobile", 320, 740],
  ]) {
    await check(
      `${name}: responsive layout and accessible navigation`,
      async () => {
        const { context, page, errors } = await openStudent(width, height);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        assert.equal(overflow, false, "No horizontal overflow");
        assert.equal(
          await page.locator("#today-next-title").textContent(),
          "Make sense of Newton’s laws",
        );
        assert.equal(
          await page
            .getByText("Activity tracking: Off", { exact: true })
            .count(),
          1,
        );
        if (width <= 680)
          assert.equal(
            await page
              .getByRole("navigation", { name: "Everyday navigation" })
              .isVisible(),
            true,
          );
        await page.screenshot({
          path: resolve(outputDir, `aimers-${name}.png`),
          fullPage: true,
        });
        if (width <= 1180) {
          assert.equal(
            await page.locator("#student-navigation").getAttribute("inert"),
            "",
          );
          await page.getByRole("button", { name: "Open navigation" }).click();
          const drawer = page.getByRole("dialog", { name: "Main navigation" });
          await drawer.waitFor();
          assert.equal(
            await page.locator("#student-navigation").getAttribute("inert"),
            null,
          );
          await page.keyboard.press("Escape");
          assert.equal(
            await page.locator("#student-navigation").getAttribute("inert"),
            "",
          );
        }
        assert.deepEqual(errors, []);
        await context.close();
      },
    );
  }
  await check(
    "session start, elapsed timer, finish and persistence requests",
    async () => {
      const { context, page, calls, errors } = await openStudent(1440, 1060);
      await page.getByRole("button", { name: "Start studying" }).click();
      await page
        .getByRole("button", { name: "Finish & save session" })
        .waitFor();
      await page.clock.runFor(65000);
      assert.equal(await page.getByLabel("Session elapsed 01:05").count(), 1);
      await page.getByRole("button", { name: "Finish & save session" }).click();
      await page.getByRole("button", { name: "Start studying" }).waitFor();
      assert.ok(
        calls.some(
          (call) =>
            call.endpoint === "/planner/tasks/task-1/sessions/start" &&
            call.method === "POST",
        ),
      );
      assert.ok(
        calls.some(
          (call) =>
            call.endpoint.endsWith("/session-test/complete") &&
            call.method === "PATCH",
        ),
      );
      assert.deepEqual(errors, []);
      await context.close();
    },
  );
  await check(
    "failed session mutation leaves the session unstarted",
    async () => {
      const { context, page, errors } = await openStudent(1024, 900, {
        failSession: true,
      });
      await page.getByRole("button", { name: "Start studying" }).click();
      await page.getByRole("alert").waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Finish & save session" })
          .count(),
        0,
      );
      assert.equal(
        await page.getByRole("button", { name: "Start studying" }).isEnabled(),
        true,
      );
      assert.deepEqual(errors, []);
      await context.close();
    },
  );
  await check(
    "search retains specialist tools and legacy names; keyboard closes dialog",
    async () => {
      const { context, page, errors } = await openStudent(1440, 1060);
      await page.keyboard.press("Control+k");
      await page
        .getByRole("dialog", { name: "All your tools, in one place" })
        .waitFor();
      const search = page.getByRole("textbox", {
        name: "Search all student tools",
      });
      await search.fill("memory engine");
      assert.equal(
        await page.getByRole("button", { name: "Revision memory" }).count(),
        1,
      );
      await search.fill("xyz-no-tool");
      assert.equal(
        await page.getByText("No tools match that search.").count(),
        1,
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator(".student-search-dialog").isVisible(),
        false,
      );
      await page.getByRole("button", { name: "Search tools" }).click();
      await search.fill("subjects");
      await page.getByRole("button", { name: "Learn" }).click();
      await page.waitForURL("**/subjects");
      await page.locator(".subjects-page").waitFor();
      await page.screenshot({
        path: resolve(outputDir, "aimers-learn.png"),
        fullPage: true,
      });
      assert.deepEqual(errors, []);
      await context.close();
    },
  );
  await check(
    "optional module failure preserves study action and marks unknown progress",
    async () => {
      const { context, page, errors } = await openStudent(390, 844, {
        partial: true,
      });
      assert.equal(
        await page.getByRole("button", { name: "Start studying" }).isVisible(),
        true,
      );
      assert.ok(
        (await page.getByRole("status").textContent()).includes("subjects"),
      );
      assert.equal(
        await page.getByText("Unavailable", { exact: true }).count(),
        1,
      );
      assert.deepEqual(errors, []);
      await context.close();
    },
  );
  await check(
    "empty plan and unassessed test results are explained",
    async () => {
      const { context, page, errors } = await openStudent(390, 844, {
        empty: true,
      });
      assert.equal(
        await page.getByText("Not checked yet", { exact: true }).count(),
        1,
      );
      assert.equal(
        await page.getByRole("link", { name: "Explore subjects" }).count(),
        1,
      );
      assert.equal(
        await page
          .getByText(
            "No scheduled tasks for today. Choose what you want to work on.",
          )
          .count(),
        1,
      );
      assert.deepEqual(errors, []);
      await context.close();
    },
  );
  await check(
    "required planner outage offers recovery without fabricated progress",
    async () => {
      const { context, page, errors } = await openStudent(390, 844, {
        offline: true,
      });
      assert.equal(
        await page.getByRole("button", { name: "Try again" }).count(),
        1,
      );
      assert.equal(
        await page.getByRole("button", { name: "Start studying" }).count(),
        0,
      );
      assert.deepEqual(errors, []);
      await context.close();
    },
  );
} finally {
  await browser.close();
}
console.log(`${checks} browser checks passed; ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
