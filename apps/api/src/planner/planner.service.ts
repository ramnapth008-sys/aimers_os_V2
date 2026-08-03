import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AcademicEnrollmentStatus,
  StudyPlanStatus,
  StudySessionStatus,
  StudyTaskPriority,
  StudyTaskStatus,
  StudyTaskType,
  StudentStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import type {
  CompleteStudySessionDto,
} from "./dto/complete-study-session.dto";

import type {
  CreateStudyPlanDto,
} from "./dto/create-study-plan.dto";

import type {
  CreateStudyTaskDto,
} from "./dto/create-study-task.dto";

import type {
  UpdateStudyTaskDto,
} from "./dto/update-study-task.dto";

@Injectable()
export class PlannerService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,
  ) {}

  private async getStudentProfile(
    userId: string,
  ) {
    const profile =
      await this.database
        .studentProfile
        .findFirst({
          where: {
            userId,
            status:
              StudentStatus.ACTIVE,
          },

          orderBy: {
            createdAt: "asc",
          },
        });

    if (!profile) {
      throw new NotFoundException(
        "Complete student onboarding before using the planner.",
      );
    }

    return profile;
  }

  private async getActiveEnrollment(
    studentProfileId: string,
  ) {
    const enrollment =
      await this.database
        .studentEnrollment
        .findFirst({
          where: {
            studentProfileId,
            status:
              AcademicEnrollmentStatus
                .ACTIVE,
          },

          orderBy: [
            {
              isPrimary: "desc",
            },
            {
              enrolledAt: "desc",
            },
          ],
        });

    if (!enrollment) {
      throw new NotFoundException(
        "An active academic enrollment is required before linking planner tasks to syllabus content.",
      );
    }

    return enrollment;
  }

  private async validateStudyPlan(
    studentProfileId: string,
    studyPlanId: string,
  ) {
    const plan =
      await this.database.studyPlan
        .findFirst({
          where: {
            id: studyPlanId,
            studentProfileId,
          },
        });

    if (!plan) {
      throw new NotFoundException(
        "The selected study plan was not found.",
      );
    }

    return plan;
  }

  private async validateAcademicLinks(
    studentProfileId: string,
    input: {
      subjectId?: string;
      chapterId?: string;
      topicId?: string;
    },
  ) {
    if (
      !input.subjectId &&
      !input.chapterId &&
      !input.topicId
    ) {
      return;
    }

    const enrollment =
      await this.getActiveEnrollment(
        studentProfileId,
      );

    if (input.subjectId) {
      const subject =
        await this.database
          .syllabusSubject
          .findFirst({
            where: {
              subjectId:
                input.subjectId,

              syllabusVersionId:
                enrollment
                  .syllabusVersionId,
            },
          });

      if (!subject) {
        throw new BadRequestException(
          "The selected subject does not belong to the student's active syllabus.",
        );
      }
    }

    if (input.chapterId) {
      const chapter =
        await this.database.chapter
          .findFirst({
            where: {
              id: input.chapterId,

              unit: {
                syllabusSubject: {
                  syllabusVersionId:
                    enrollment
                      .syllabusVersionId,
                },
              },
            },
          });

      if (!chapter) {
        throw new BadRequestException(
          "The selected chapter does not belong to the student's active syllabus.",
        );
      }
    }

    if (input.topicId) {
      const topic =
        await this.database.topic
          .findFirst({
            where: {
              id: input.topicId,

              chapter: {
                unit: {
                  syllabusSubject: {
                    syllabusVersionId:
                      enrollment
                        .syllabusVersionId,
                  },
                },
              },
            },
          });

      if (!topic) {
        throw new BadRequestException(
          "The selected topic does not belong to the student's active syllabus.",
        );
      }
    }
  }

  async getWorkspace(
    userId: string,
  ) {
    const profile =
      await this.getStudentProfile(
        userId,
      );

    const plans =
      await this.database.studyPlan
        .findMany({
          where: {
            studentProfileId:
              profile.id,

            status: {
              not:
                StudyPlanStatus
                  .ARCHIVED,
            },
          },

          orderBy: [
            {
              status: "asc",
            },
            {
              startDate: "asc",
            },
          ],

          include: {
            tasks: {
              orderBy: [
                {
                  status: "asc",
                },
                {
                  priority: "desc",
                },
                {
                  scheduledFor: "asc",
                },
                {
                  sortOrder: "asc",
                },
              ],

              include: {
                subject: true,
                chapter: true,
                topic: true,
              },
            },
          },
        });

    const tasks =
      await this.database.studyTask
        .findMany({
          where: {
            studentProfileId:
              profile.id,

            status: {
              not:
                StudyTaskStatus
                  .CANCELLED,
            },
          },

          orderBy: [
            {
              status: "asc",
            },
            {
              priority: "desc",
            },
            {
              scheduledFor: "asc",
            },
            {
              dueAt: "asc",
            },
          ],

          include: {
            studyPlan: true,
            subject: true,
            chapter: true,
            topic: true,

            sessions: {
              orderBy: {
                createdAt: "desc",
              },
              take: 5,
            },
          },
        });

    const sessions =
      await this.database
        .studySession
        .findMany({
          where: {
            studentProfileId:
              profile.id,
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 25,

          include: {
            studyTask: true,
            chapter: true,
            topic: true,
          },
        });

    const now = new Date();

    const activeTasks =
      tasks.filter(
        (task) =>
          task.status !==
          StudyTaskStatus.COMPLETED,
      );

    const overdueTasks =
      activeTasks.filter(
        (task) =>
          Boolean(
            task.dueAt &&
            task.dueAt < now,
          ),
      );

    const completedTasks =
      tasks.filter(
        (task) =>
          task.status ===
          StudyTaskStatus.COMPLETED,
      );

    const plannedMinutes =
      activeTasks.reduce(
        (total, task) =>
          total +
          task.estimatedMinutes,
        0,
      );

    const completedSessionMinutes =
      sessions
        .filter(
          (session) =>
            session.status ===
            StudySessionStatus
              .COMPLETED,
        )
        .reduce(
          (total, session) =>
            total +
            session.durationMinutes,
          0,
        );

    return {
      plans,
      tasks,
      sessions,

      summary: {
        planCount: plans.length,
        taskCount: tasks.length,
        activeTaskCount:
          activeTasks.length,
        completedTaskCount:
          completedTasks.length,
        overdueTaskCount:
          overdueTasks.length,
        plannedMinutes,
        completedSessionMinutes,
      },
    };
  }

  async createPlan(
    userId: string,
    dto: CreateStudyPlanDto,
  ) {
    const profile =
      await this.getStudentProfile(
        userId,
      );

    const startDate =
      new Date(dto.startDate);

    const endDate =
      dto.endDate
        ? new Date(dto.endDate)
        : null;

    if (
      endDate &&
      endDate < startDate
    ) {
      throw new BadRequestException(
        "endDate cannot be earlier than startDate.",
      );
    }

    return this.database.studyPlan
      .create({
        data: {
          studentProfileId:
            profile.id,

          name: dto.name.trim(),

          description:
            dto.description
              ?.trim() || null,

          startDate,
          endDate,

          status:
            StudyPlanStatus.ACTIVE,
        },
      });
  }

  async createTask(
    userId: string,
    dto: CreateStudyTaskDto,
  ) {
    const profile =
      await this.getStudentProfile(
        userId,
      );

    if (dto.studyPlanId) {
      await this.validateStudyPlan(
        profile.id,
        dto.studyPlanId,
      );
    }

    await this.validateAcademicLinks(
      profile.id,
      dto,
    );

    const scheduledFor =
      dto.scheduledFor
        ? new Date(dto.scheduledFor)
        : null;

    const dueAt =
      dto.dueAt
        ? new Date(dto.dueAt)
        : null;

    if (
      scheduledFor &&
      dueAt &&
      dueAt < scheduledFor
    ) {
      throw new BadRequestException(
        "dueAt cannot be earlier than scheduledFor.",
      );
    }

    return this.database.studyTask
      .create({
        data: {
          studentProfileId:
            profile.id,

          studyPlanId:
            dto.studyPlanId,

          subjectId:
            dto.subjectId,

          chapterId:
            dto.chapterId,

          topicId:
            dto.topicId,

          title:
            dto.title.trim(),

          description:
            dto.description
              ?.trim() || null,

          type:
            dto.type ??
            StudyTaskType.STUDY,

          priority:
            dto.priority ??
            StudyTaskPriority.MEDIUM,

          scheduledFor,
          dueAt,

          estimatedMinutes:
            dto.estimatedMinutes ??
            30,
        },

        include: {
          studyPlan: true,
          subject: true,
          chapter: true,
          topic: true,
        },
      });
  }

  async updateTask(
    userId: string,
    taskId: string,
    dto: UpdateStudyTaskDto,
  ) {
    const profile =
      await this.getStudentProfile(
        userId,
      );

    const existing =
      await this.database.studyTask
        .findFirst({
          where: {
            id: taskId,
            studentProfileId:
              profile.id,
          },
        });

    if (!existing) {
      throw new NotFoundException(
        "The study task was not found.",
      );
    }

    if (dto.studyPlanId) {
      await this.validateStudyPlan(
        profile.id,
        dto.studyPlanId,
      );
    }

    await this.validateAcademicLinks(
      profile.id,
      dto,
    );

    const completionPercent =
      dto.completionPercent ??
      existing.completionPercent;

    let status =
      dto.status ??
      existing.status;

    if (
      dto.status === undefined
    ) {
      if (
        completionPercent >= 100
      ) {
        status =
          StudyTaskStatus
            .COMPLETED;
      } else if (
        completionPercent > 0 &&
        status ===
          StudyTaskStatus.TODO
      ) {
        status =
          StudyTaskStatus
            .IN_PROGRESS;
      }
    }

    const normalizedCompletion =
      status ===
      StudyTaskStatus.COMPLETED
        ? 100
        : completionPercent;

    const scheduledFor =
      dto.scheduledFor
        ? new Date(dto.scheduledFor)
        : undefined;

    const dueAt =
      dto.dueAt
        ? new Date(dto.dueAt)
        : undefined;

    const nextScheduledFor =
      scheduledFor ??
      existing.scheduledFor;

    const nextDueAt =
      dueAt ??
      existing.dueAt;

    if (
      nextScheduledFor &&
      nextDueAt &&
      nextDueAt <
        nextScheduledFor
    ) {
      throw new BadRequestException(
        "dueAt cannot be earlier than scheduledFor.",
      );
    }

    return this.database.studyTask
      .update({
        where: {
          id: existing.id,
        },

        data: {
          studyPlanId:
            dto.studyPlanId,

          subjectId:
            dto.subjectId,

          chapterId:
            dto.chapterId,

          topicId:
            dto.topicId,

          title:
            dto.title?.trim(),

          description:
            dto.description ===
              undefined
              ? undefined
              : dto.description
                  .trim() || null,

          type: dto.type,
          status,
          priority:
            dto.priority,

          scheduledFor,
          dueAt,

          estimatedMinutes:
            dto.estimatedMinutes,

          actualMinutes:
            dto.actualMinutes,

          completionPercent:
            normalizedCompletion,

          completedAt:
            status ===
            StudyTaskStatus.COMPLETED
              ? existing.completedAt ??
                new Date()
              : null,
        },

        include: {
          studyPlan: true,
          subject: true,
          chapter: true,
          topic: true,
        },
      });
  }

  async deleteTask(
    userId: string,
    taskId: string,
  ) {
    const profile =
      await this.getStudentProfile(
        userId,
      );

    const task =
      await this.database.studyTask
        .findFirst({
          where: {
            id: taskId,
            studentProfileId:
              profile.id,
          },
        });

    if (!task) {
      throw new NotFoundException(
        "The study task was not found.",
      );
    }

    await this.database.studyTask
      .delete({
        where: {
          id: task.id,
        },
      });

    return {
      deleted: true,
      taskId,
    };
  }

  async startSession(
    userId: string,
    taskId: string,
  ) {
    const profile =
      await this.getStudentProfile(
        userId,
      );

    const task =
      await this.database.studyTask
        .findFirst({
          where: {
            id: taskId,
            studentProfileId:
              profile.id,

            status: {
              notIn: [
                StudyTaskStatus
                  .COMPLETED,

                StudyTaskStatus
                  .CANCELLED,
              ],
            },
          },
        });

    if (!task) {
      throw new NotFoundException(
        "The active study task was not found.",
      );
    }

    const activeSession =
      await this.database
        .studySession
        .findFirst({
          where: {
            studentProfileId:
              profile.id,

            status:
              StudySessionStatus
                .ACTIVE,
          },
        });

    if (activeSession) {
      throw new ConflictException(
        "Complete or cancel the current active study session before starting another.",
      );
    }

    return this.database
      .$transaction(
        async (transaction) => {
          await transaction
            .studyTask
            .update({
              where: {
                id: task.id,
              },

              data: {
                status:
                  task.status ===
                  StudyTaskStatus.TODO
                    ? StudyTaskStatus
                        .IN_PROGRESS
                    : task.status,
              },
            });

          return transaction
            .studySession
            .create({
              data: {
                studentProfileId:
                  profile.id,

                studyTaskId:
                  task.id,

                chapterId:
                  task.chapterId,

                topicId:
                  task.topicId,

                status:
                  StudySessionStatus
                    .ACTIVE,

                plannedStartAt:
                  task.scheduledFor,

                startedAt:
                  new Date(),

                plannedMinutes:
                  task.estimatedMinutes,
              },

              include: {
                studyTask: true,
                chapter: true,
                topic: true,
              },
            });
        },
      );
  }

  async completeSession(
    userId: string,
    sessionId: string,
    dto: CompleteStudySessionDto,
  ) {
    const profile =
      await this.getStudentProfile(
        userId,
      );

    const session =
      await this.database
        .studySession
        .findFirst({
          where: {
            id: sessionId,

            studentProfileId:
              profile.id,

            status:
              StudySessionStatus
                .ACTIVE,
          },
        });

    if (!session) {
      throw new NotFoundException(
        "The active study session was not found.",
      );
    }

    const endedAt = new Date();

    const calculatedMinutes =
      session.startedAt
        ? Math.max(
            1,
            Math.round(
              (
                endedAt.getTime() -
                session
                  .startedAt
                  .getTime()
              ) /
              60000,
            ),
          )
        : 1;

    const durationMinutes =
      dto.durationMinutes ??
      calculatedMinutes;

    const focusMinutes =
      Math.min(
        dto.focusMinutes ??
          durationMinutes,
        durationMinutes,
      );

    return this.database
      .$transaction(
        async (transaction) => {
          const completed =
            await transaction
              .studySession
              .update({
                where: {
                  id: session.id,
                },

                data: {
                  status:
                    StudySessionStatus
                      .COMPLETED,

                  endedAt,
                  durationMinutes,
                  focusMinutes,

                  notes:
                    dto.notes
                      ?.trim() || null,
                },

                include: {
                  studyTask: true,
                  chapter: true,
                  topic: true,
                },
              });

          if (session.studyTaskId) {
            await transaction
              .studyTask
              .update({
                where: {
                  id:
                    session.studyTaskId,
                },

                data: {
                  actualMinutes: {
                    increment:
                      durationMinutes,
                  },
                },
              });
          }

          return completed;
        },
      );
  }
}
