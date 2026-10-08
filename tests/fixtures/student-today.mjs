// Synthetic student data for repeatable UI verification. Never used by the app.
export const fixtureNow = new Date("2026-10-08T05:00:00.000Z");
export function makeStudentFixtures() {
  const timestamp = "2026-10-08T04:00:00.000Z";
  const subjects = ["Physics", "Chemistry", "Mathematics"].map(
    (name, index) => {
      const subject = {
        id: `subject-${index}`,
        code: name.toUpperCase(),
        name,
        description: null,
        status: "ACTIVE",
      };
      return {
        id: `syllabus-subject-${index}`,
        subjectId: subject.id,
        syllabusVersionId: "syllabus",
        sequenceNumber: index,
        isRequired: true,
        weightage: null,
        subject,
        units: [
          {
            id: `unit-${index}`,
            syllabusSubjectId: `syllabus-subject-${index}`,
            code: "UNIT",
            name: "Foundations",
            description: null,
            sequenceNumber: 1,
            chapters: [
              "Laws of motion",
              "Work and energy",
              "Momentum",
              "Revision",
            ].map((chapterName, chapterIndex) => ({
              id: `chapter-${index}-${chapterIndex}`,
              unitId: `unit-${index}`,
              code: "CHAPTER",
              name:
                index === 0 ? chapterName : `${name} topic ${chapterIndex + 1}`,
              description: null,
              sequenceNumber: chapterIndex,
              estimatedMinutes: 25,
              topics: [
                {
                  id: `topic-${index}-${chapterIndex}`,
                  chapterId: `chapter-${index}-${chapterIndex}`,
                  code: "TOPIC",
                  name:
                    index === 0 && chapterIndex === 0
                      ? "Newton’s second law"
                      : "Key concepts",
                  description: null,
                  sequenceNumber: 1,
                  estimatedMinutes: 15,
                },
              ],
            })),
          },
        ],
      };
    },
  );
  const task = (id, title, status, type, subjectIndex, estimatedMinutes) => ({
    id,
    studentProfileId: "student",
    studyPlanId: "plan",
    subjectId: `subject-${subjectIndex}`,
    chapterId: `chapter-${subjectIndex}-0`,
    topicId: null,
    title,
    description:
      "Work through the concept, try an example, and explain it in your own words.",
    type,
    status,
    priority: "MEDIUM",
    scheduledFor: timestamp,
    dueAt: "2026-10-08T15:00:00.000Z",
    estimatedMinutes,
    actualMinutes: 0,
    completionPercent: status === "COMPLETED" ? 100 : 0,
    completedAt: status === "COMPLETED" ? timestamp : null,
    sortOrder: Number(id.slice(-1)) || 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    subject: subjects[subjectIndex].subject,
  });
  const tasks = [
    task("task-1", "Make sense of Newton’s laws", "TODO", "STUDY", 0, 25),
    task("task-2", "Revisit chemical bonding", "TODO", "REVISION", 1, 15),
    task(
      "task-3",
      "Practise quadratic equations",
      "COMPLETED",
      "PRACTICE",
      2,
      30,
    ),
  ];
  const academic = {
    id: "enrollment",
    studentProfileId: "student",
    syllabusVersionId: "syllabus",
    status: "ACTIVE",
    isPrimary: true,
    enrolledAt: timestamp,
    startedAt: timestamp,
    completedAt: null,
    syllabusVersion: {
      id: "syllabus",
      programmeId: "programme",
      versionCode: "2026",
      name: "JEE Main syllabus",
      description: null,
      isDefault: true,
      status: "ACTIVE",
      programme: {
        id: "programme",
        code: "JEE_MAIN",
        name: "JEE Main · sample data",
        description: null,
        type: "COMPETITIVE",
        status: "ACTIVE",
        board: null,
      },
      subjects,
    },
    chapterProgress: [
      {
        id: "progress",
        studentEnrollmentId: "enrollment",
        chapterId: "chapter-0-0",
        state: "IN_PROGRESS",
        completionPercent: 40,
        revisionCount: 1,
        questionAttempts: 10,
        correctAnswers: 7,
        startedAt: timestamp,
        completedAt: null,
        lastStudiedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    topicMastery: [],
    summary: {
      subjectCount: 3,
      chapterCount: 12,
      topicCount: 12,
      completedChapters: 5,
      masteredTopics: 0,
      chapterCompletionPercent: 42,
    },
  };
  // Keep the workspace summary consistent with its chapter records.
  for (const chapterId of [
    "chapter-0-1",
    "chapter-0-2",
    "chapter-1-0",
    "chapter-1-1",
    "chapter-2-0",
  ]) {
    academic.chapterProgress.push({
      ...academic.chapterProgress[0],
      id: `progress-${chapterId}`,
      chapterId,
      state: "COMPLETED",
      completionPercent: 100,
      completedAt: timestamp,
    });
  }
  const planner = {
    plans: [],
    tasks,
    sessions: [],
    summary: {
      planCount: 1,
      taskCount: 3,
      activeTaskCount: 2,
      completedTaskCount: 1,
      overdueTaskCount: 0,
      plannedMinutes: 70,
      completedSessionMinutes: 70,
    },
    activity: {
      timeZone: "Asia/Kolkata",
      todayDateKey: "2026-10-08",
      weekStartDateKey: "2026-10-05",
      todayMinutes: 70,
      weeklyMinutes: 295,
      completedSessionCount: 4,
      studyStreakDays: 3,
      activeSessionId: null,
      dailyMinutes: [],
    },
  };
  const mockTests = {
    availableTests: [],
    attempts: [{ id: "attempt", attemptedQuestions: 80, correctAnswers: 60 }],
    weakTopics: [],
    trend: [],
    summary: {
      availableTestCount: 0,
      attemptCount: 1,
      averagePercentage: 60,
      averageAccuracy: 75,
      bestPercentage: 60,
      latestAttempt: null,
      predictionReady: false,
    },
  };
  const privacy = { monitoringEnabled: false, pausedAt: null };
  return { planner, academic, mockTests, privacy, unavailable: [] };
}
