import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  ConfigService,
} from "@nestjs/config";

import {
  AiProviderError,
  createAiProvider,
  type AiProviderName,
  type AiTextProvider,
} from "@aimers/ai";

import {
  ConsentScope,
  InterventionStatus,
  StudyTaskStatus,
  type Prisma,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import {
  ConsentService,
} from "../consent/consent.service";

import {
  DetailedActivityContextService,
  type DetailedActivityContext,
} from "./detailed-activity-context.service";

import type {
  GenerateMentorBriefDto,
} from "./dto/generate-mentor-brief.dto";

import type {
  RespondMentorCheckInDto,
} from "./dto/respond-mentor-check-in.dto";

import type {
  SendMentorMessageDto,
} from "./dto/send-mentor-message.dto";

interface MentorContext {
  generatedAt: string;
  taskSummary: {
    active: number;
    overdue: number;
    nextTask: {
      id: string;
      title: string;
      priority: string;
      estimatedMinutes: number;
      subject: string | null;
      chapter: string | null;
      scheduledFor: Date | null;
      dueAt: Date | null;
    } | null;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      estimatedMinutes: number;
      completionPercent: number;
      subject: string | null;
      chapter: string | null;
      topic: string | null;
      scheduledFor: Date | null;
      dueAt: Date | null;
    }>;
  };
  behavior: {
    enabled: boolean;
    signals: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      recommendedAction: string | null;
      confidenceScore: number;
      dataConfidence: string;
      detectedAt: Date;
    }>;
    latestScores: {
      academicReadinessScore: number | null;
      focusScore: number | null;
      revisionConsistencyScore: number | null;
      distractionRiskScore: number | null;
      overloadRiskScore: number | null;
      coveragePercent: number;
      predictionConfidence: string;
    } | null;
    recentDays: Array<{
      summaryDate: Date;
      studySeconds: number;
      distractionSeconds: number;
      focusedStudySeconds: number;
      contextSwitches: number;
      longestFocusSeconds: number;
      confidence: string;
    }>;
  };
  guidance: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
    message: string;
    actionConfig: unknown;
    scheduledAt: Date | null;
    expiresAt: Date | null;
  }>;
  detailedActivity:
    DetailedActivityContext;
  privacy: {
    aiContextEnabled: boolean;
    behaviorContextEnabled: boolean;
    notificationsEligible: boolean;
    rawActivityIncluded: boolean;
    fullUrlsIncluded: boolean;
  };
}

// AIMERS_AI_MENTOR_CONFIDENCE_SCALE_FIX_V1
function confidencePercent(
  value:
    number,
): number {
  return Math.round(
    Math.max(
      0,
      Math.min(
        1,
        value,
      ),
    ) *
      100,
  );
}

@Injectable()
export class AiMentorService {
  private readonly provider:
    AiTextProvider;

  private readonly providerName:
    AiProviderName;

  private readonly model:
    string;

  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(ConsentService)
    private readonly consentService:
      ConsentService,

    @Inject(DetailedActivityContextService)
    private readonly detailedActivityContextService:
      DetailedActivityContextService,

    @Inject(ConfigService)
    configService:
      ConfigService,
  ) {
    this.providerName =
      configService
        .getOrThrow<AiProviderName>(
          "AI_PROVIDER",
        );

    this.model =
      configService
        .getOrThrow<string>(
          "AI_MODEL",
        );

    this.provider =
      createAiProvider({
        provider:
          this.providerName,
        model:
          this.model,
        timeoutMs:
          configService
            .getOrThrow<number>(
              "AI_TIMEOUT_MS",
            ),
        maxOutputTokens:
          configService
            .getOrThrow<number>(
              "AI_MAX_OUTPUT_TOKENS",
            ),
        openAiApiKey:
          configService
            .get<string>(
              "OPENAI_API_KEY",
            ),
        openAiBaseUrl:
          configService
            .get<string>(
              "OPENAI_BASE_URL",
            ),
      });
  }

  async workspace(
    userId:
      string,
    timezone =
      "Asia/Kolkata",
  ) {
    const {
      profile,
      privacy,
    } =
      await this.requireAccess(
        userId,
      );

    const conversation =
      await this.ensureConversation(
        profile.id,
      );

    const context =
      await this.buildContext(
        profile.id,
        privacy,
      );

    const [
      messages,
      brief,
      checkIn,
    ] =
      await Promise.all([
        this.database
          .mentorMessage
          .findMany({
            where: {
              conversationId:
                conversation.id,
            },
            orderBy: {
              createdAt:
                "asc",
            },
            take:
              80,
          }),

        this.ensureDailyBrief(
          profile.id,
          timezone,
          context,
          false,
        ),

        this.ensureCheckIn(
          profile.id,
          conversation.id,
          context,
        ),
      ]);

    return {
      provider: {
        name:
          this.providerName,
        model:
          this.model,
        live:
          this.providerName ===
          "openai",
      },
      conversation,
      messages,
      brief,
      checkIn,
      context,
      boundaries: {
        rawActivityIncluded:
          context
            .detailedActivity
            .enabled,
        fullUrlsIncluded:
          context
            .detailedActivity
            .sanitizedUrlCount >
            0,
        detailedContextPolicyVersion:
          context
            .detailedActivity
            .policyVersion,
        contextAuditId:
          context
            .detailedActivity
            .auditId,
        medicalDiagnosis:
          false,
        pushNotificationsImplemented:
          false,
      },
    };
  }

  async sendMessage(
    userId:
      string,
    dto:
      SendMentorMessageDto,
  ) {
    const {
      profile,
      privacy,
    } =
      await this.requireAccess(
        userId,
      );

    const conversation =
      dto.conversationId
        ? await this.getConversation(
            profile.id,
            dto.conversationId,
          )
        : await this.ensureConversation(
            profile.id,
          );

    const content =
      dto.content.trim();

    const userMessage =
      await this.database
        .mentorMessage
        .create({
          data: {
            conversationId:
              conversation.id,
            role:
              "USER",
            content,
          },
        });

    const [
      context,
      history,
    ] =
      await Promise.all([
        this.buildContext(
          profile.id,
          privacy,
        ),

        this.database
          .mentorMessage
          .findMany({
            where: {
              conversationId:
                conversation.id,
            },
            orderBy: {
              createdAt:
                "desc",
            },
            take:
              14,
          }),
      ]);

    const result =
      await this.generateReply(
        profile.id,
        content,
        context,
        history
          .reverse()
          .map(
            (message) => ({
              role:
                message.role ===
                "ASSISTANT"
                  ? "assistant" as const
                  : "user" as const,
              content:
                message.content,
            }),
          ),
      );

    const assistantMessage =
      await this.database
        .$transaction(
          async (
            transaction,
          ) => {
            const saved =
              await transaction
                .mentorMessage
                .create({
                  data: {
                    conversationId:
                      conversation.id,
                    role:
                      "ASSISTANT",
                    content:
                      result.text,
                    provider:
                      result.provider,
                    model:
                      result.model,
                    inputTokens:
                      result.inputTokens,
                    outputTokens:
                      result.outputTokens,
                    contextSummary:
                      this.contextForStorage(
                        context,
                      ) as
                        Prisma.InputJsonValue,
                  },
                });

            await transaction
              .mentorConversation
              .update({
                where: {
                  id:
                    conversation.id,
                },
                data: {
                  lastMessageAt:
                    saved.createdAt,
                  title:
                    conversation.title ===
                    "Daily Mentor"
                      ? this.conversationTitle(
                          content,
                        )
                      : undefined,
                },
              });

            return saved;
          },
        );

    return {
      success:
        true,
      userMessage,
      assistantMessage,
    };
  }

  async generateBrief(
    userId:
      string,
    dto:
      GenerateMentorBriefDto,
  ) {
    const {
      profile,
      privacy,
    } =
      await this.requireAccess(
        userId,
      );

    const timezone =
      dto.timezone?.trim() ||
      "Asia/Kolkata";

    const context =
      await this.buildContext(
        profile.id,
        privacy,
      );

    const brief =
      await this.ensureDailyBrief(
        profile.id,
        timezone,
        context,
        dto.force ??
          true,
      );

    return {
      success:
        true,
      brief,
    };
  }

  async respondToCheckIn(
    userId:
      string,
    checkInId:
      string,
    dto:
      RespondMentorCheckInDto,
  ) {
    const {
      profile,
    } =
      await this.requireAccess(
        userId,
      );

    const checkIn =
      await this.database
        .mentorCheckIn
        .findFirst({
          where: {
            id:
              checkInId,
            studentProfileId:
              profile.id,
          },
          include: {
            response:
              true,
          },
        });

    if (!checkIn) {
      throw new NotFoundException(
        "The mentor check-in was not found.",
      );
    }

    if (
      checkIn.response ||
      checkIn.status ===
      "ANSWERED"
    ) {
      throw new ForbiddenException(
        "This mentor check-in has already been answered.",
      );
    }

    const response =
      await this.database
        .$transaction(
          async (
            transaction,
          ) => {
            const saved =
              await transaction
                .mentorCheckInResponse
                .create({
                  data: {
                    checkInId:
                      checkIn.id,
                    answer:
                      dto.answer.trim(),
                    selectedOption:
                      dto.selectedOption
                        ?.trim() ||
                      null,
                    energyScore:
                      dto.energyScore,
                    focusScore:
                      dto.focusScore,
                    moodScore:
                      dto.moodScore,
                  },
                });

            await transaction
              .mentorCheckIn
              .update({
                where: {
                  id:
                    checkIn.id,
                },
                data: {
                  status:
                    "ANSWERED",
                  answeredAt:
                    new Date(),
                },
              });

            return saved;
          },
        );

    return {
      success:
        true,
      response,
    };
  }

  private async requireAccess(
    userId:
      string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.consentService
      .assertScopeActiveForProfile(
        profile.id,
        ConsentScope
          .AI_CONTEXT_SHARING,
      );

    const privacy =
      await this.database
        .privacyPreference
        .findUnique({
          where: {
            studentProfileId:
              profile.id,
          },
        });

    if (
      !privacy
        ?.allowAiContext
    ) {
      throw new ForbiddenException(
        "AI Mentor context is disabled in Privacy Settings.",
      );
    }

    return {
      profile,
      privacy,
    };
  }

  private async ensureConversation(
    studentProfileId:
      string,
  ) {
    const existing =
      await this.database
        .mentorConversation
        .findFirst({
          where: {
            studentProfileId,
            status:
              "ACTIVE",
          },
          orderBy: {
            updatedAt:
              "desc",
          },
        });

    if (existing) {
      return existing;
    }

    return this.database
      .mentorConversation
      .create({
        data: {
          studentProfileId,
          title:
            "Daily Mentor",
          status:
            "ACTIVE",
        },
      });
  }

  private async getConversation(
    studentProfileId:
      string,
    conversationId:
      string,
  ) {
    const conversation =
      await this.database
        .mentorConversation
        .findFirst({
          where: {
            id:
              conversationId,
            studentProfileId,
          },
        });

    if (!conversation) {
      throw new NotFoundException(
        "The mentor conversation was not found.",
      );
    }

    return conversation;
  }

  private async buildContext(
    studentProfileId:
      string,
    privacy: {
      allowBehaviorAnalysis:
        boolean;
      allowNotifications:
        boolean;
    },
  ): Promise<MentorContext> {
    const now =
      new Date();

    const behaviorEnabled =
      privacy
        .allowBehaviorAnalysis;

    const detailedActivity =
      await this
        .detailedActivityContextService
        .build(
          studentProfileId,
        );

    const [
      tasks,
      signals,
      snapshot,
      recentDays,
      guidance,
    ] =
      await Promise.all([
        this.database
          .studyTask
          .findMany({
            where: {
              studentProfileId,
              status: {
                notIn: [
                  StudyTaskStatus
                    .COMPLETED,
                  StudyTaskStatus
                    .CANCELLED,
                ],
              },
            },
            include: {
              subject: {
                select: {
                  name:
                    true,
                },
              },
              chapter: {
                select: {
                  name:
                    true,
                },
              },
              topic: {
                select: {
                  name:
                    true,
                },
              },
            },
            orderBy: [
              {
                priority:
                  "desc",
              },
              {
                dueAt:
                  "asc",
              },
              {
                scheduledFor:
                  "asc",
              },
            ],
            take:
              12,
          }),

        behaviorEnabled
          ? this.database
              .behaviorSignal
              .findMany({
                where: {
                  studentProfileId,
                  resolvedAt:
                    null,
                },
                orderBy: [
                  {
                    severity:
                      "desc",
                  },
                  {
                    detectedAt:
                      "desc",
                  },
                ],
                take:
                  10,
              })
          : Promise.resolve(
              [],
            ),

        behaviorEnabled
          ? this.database
              .studentIntelligenceSnapshot
              .findFirst({
                where: {
                  studentProfileId,
                },
                orderBy: {
                  generatedAt:
                    "desc",
                },
              })
          : Promise.resolve(
              null,
            ),

        behaviorEnabled
          ? this.database
              .dailyActivitySummary
              .findMany({
                where: {
                  studentProfileId,
                },
                orderBy: {
                  summaryDate:
                    "desc",
                },
                take:
                  7,
                select: {
                  summaryDate:
                    true,
                  studySeconds:
                    true,
                  distractionSeconds:
                    true,
                  focusedStudySeconds:
                    true,
                  contextSwitches:
                    true,
                  longestFocusSeconds:
                    true,
                  confidence:
                    true,
                },
              })
          : Promise.resolve(
              [],
            ),

        this.database
          .intervention
          .findMany({
            where: {
              studentProfileId,
              status: {
                in: [
                  InterventionStatus
                    .SUGGESTED,
                  InterventionStatus
                    .ACCEPTED,
                  InterventionStatus
                    .ACTIVE,
                ],
              },
            },
            orderBy: {
              createdAt:
                "desc",
            },
            take:
              10,
          }),
      ]);

    const overdue =
      tasks.filter(
        (task) =>
          Boolean(
            task.dueAt &&
            task.dueAt <
              now,
          ),
      );

    const nextTask =
      tasks[0]
        ? {
            id:
              tasks[0].id,
            title:
              tasks[0]
                .title,
            priority:
              tasks[0]
                .priority,
            estimatedMinutes:
              tasks[0]
                .estimatedMinutes,
            subject:
              tasks[0]
                .subject
                ?.name ??
              null,
            chapter:
              tasks[0]
                .chapter
                ?.name ??
              null,
            scheduledFor:
              tasks[0]
                .scheduledFor,
            dueAt:
              tasks[0]
                .dueAt,
          }
        : null;

    return {
      generatedAt:
        now.toISOString(),

      taskSummary: {
        active:
          tasks.length,
        overdue:
          overdue.length,
        nextTask,
        tasks:
          tasks.map(
            (task) => ({
              id:
                task.id,
              title:
                task.title,
              status:
                task.status,
              priority:
                task.priority,
              estimatedMinutes:
                task
                  .estimatedMinutes,
              completionPercent:
                task
                  .completionPercent,
              subject:
                task.subject
                  ?.name ??
                null,
              chapter:
                task.chapter
                  ?.name ??
                null,
              topic:
                task.topic
                  ?.name ??
                null,
              scheduledFor:
                task
                  .scheduledFor,
              dueAt:
                task.dueAt,
            }),
          ),
      },

      behavior: {
        enabled:
          behaviorEnabled,
        signals:
          signals.map(
            (signal) => ({
              id:
                signal.id,
              type:
                signal.type,
              severity:
                signal.severity,
              title:
                signal.title,
              description:
                signal.description,
              recommendedAction:
                signal
                  .recommendedAction,
              confidenceScore:
                signal
                  .confidenceScore,
              dataConfidence:
                signal
                  .dataConfidence,
              detectedAt:
                signal
                  .detectedAt,
            }),
          ),
        latestScores:
          snapshot
            ? {
                academicReadinessScore:
                  snapshot
                    .academicReadinessScore,
                focusScore:
                  snapshot
                    .focusScore,
                revisionConsistencyScore:
                  snapshot
                    .revisionConsistencyScore,
                distractionRiskScore:
                  snapshot
                    .distractionRiskScore,
                overloadRiskScore:
                  snapshot
                    .overloadRiskScore,
                coveragePercent:
                  snapshot
                    .coveragePercent,
                predictionConfidence:
                  snapshot
                    .predictionConfidence,
              }
            : null,
        recentDays,
      },

      guidance:
        guidance.map(
          (item) => ({
            id:
              item.id,
            type:
              item.type,
            status:
              item.status,
            title:
              item.title,
            message:
              item.message,
            actionConfig:
              item.actionConfig,
            scheduledAt:
              item.scheduledAt,
            expiresAt:
              item.expiresAt,
          }),
        ),

      detailedActivity,

      privacy: {
        aiContextEnabled:
          true,
        behaviorContextEnabled:
          behaviorEnabled,
        notificationsEligible:
          privacy
            .allowNotifications,
        rawActivityIncluded:
          detailedActivity
            .enabled,
        fullUrlsIncluded:
          detailedActivity
            .enabled &&
          detailedActivity
            .sanitizedUrlCount >
            0,
      },
    };
  }

  private async ensureDailyBrief(
    studentProfileId:
      string,
    timezone:
      string,
    context:
      MentorContext,
    force:
      boolean,
  ) {
    const briefDate =
      this.dateForTimezone(
        timezone,
      );

    if (!force) {
      const existing =
        await this.database
          .mentorDailyBrief
          .findUnique({
            where: {
              studentProfileId_briefDate_kind: {
                studentProfileId,
                briefDate,
                kind:
                  "DAILY",
              },
            },
          });

      if (existing) {
        return existing;
      }
    }

    const draft =
      this.briefDraft(
        context,
      );

    let summary =
      draft.summary;

    let generatedBy =
      "RULES";

    if (
      this.providerName ===
      "openai"
    ) {
      try {
        const generated =
          await this.provider
            .generateText({
              instructions:
                this.mentorInstructions(),
              messages: [
                {
                  role:
                    "user",
                  content: [
                    "Create a concise daily mentor briefing from this structured context.",
                    "Do not invent facts.",
                    "Use permitted detailed activity evidence when it is enabled, but never expose unsanitized URLs or sensitive values.",
                    JSON.stringify(
                      this.contextForStorage(
                        context,
                      ),
                    ),
                  ].join(
                    "\n\n",
                  ),
                },
              ],
              maxOutputTokens:
                700,
              safetyIdentifier:
                studentProfileId,
            });

        summary =
          generated.text;
        generatedBy =
          generated.provider;
      } catch (
        error
      ) {
        if (
          !(
            error instanceof
            AiProviderError
          )
        ) {
          throw error;
        }
      }
    }

    return this.database
      .mentorDailyBrief
      .upsert({
        where: {
          studentProfileId_briefDate_kind: {
            studentProfileId,
            briefDate,
            kind:
              "DAILY",
          },
        },
        create: {
          studentProfileId,
          briefDate,
          timezone,
          kind:
            "DAILY",
          headline:
            draft.headline,
          summary,
          priorities:
            draft.priorities as
              Prisma.InputJsonValue,
          risks:
            draft.risks as
              Prisma.InputJsonValue,
          nextActions:
            draft.nextActions as
              Prisma.InputJsonValue,
          contextSnapshot:
            this.contextForStorage(
              context,
            ) as
              Prisma.InputJsonValue,
          generatedBy,
        },
        update: {
          timezone,
          headline:
            draft.headline,
          summary,
          priorities:
            draft.priorities as
              Prisma.InputJsonValue,
          risks:
            draft.risks as
              Prisma.InputJsonValue,
          nextActions:
            draft.nextActions as
              Prisma.InputJsonValue,
          contextSnapshot:
            this.contextForStorage(
              context,
            ) as
              Prisma.InputJsonValue,
          generatedBy,
        },
      });
  }

  private async ensureCheckIn(
    studentProfileId:
      string,
    conversationId:
      string,
    context:
      MentorContext,
  ) {
    const existing =
      await this.database
        .mentorCheckIn
        .findFirst({
          where: {
            studentProfileId,
            status:
              "OPEN",
          },
          include: {
            response:
              true,
          },
          orderBy: {
            askedAt:
              "desc",
          },
        });

    if (existing) {
      return existing;
    }

    const signal =
      context.behavior
        .signals[0];

    const question =
      signal
        ? `AIMERS noticed "${signal.title}". What best explains this pattern from your side?`
        : "How are your energy, focus, and interest in today's study plan?";

    const options =
      signal
        ? [
            "The topic is difficult",
            "I feel tired",
            "I am bored or less interested",
            "I feel stressed or anxious",
            "External interruptions",
            "Another reason",
          ]
        : [
            "Ready to study",
            "Low energy",
            "Difficulty starting",
            "Confused about priorities",
            "Need a lighter plan",
          ];

    return this.database
      .mentorCheckIn
      .create({
        data: {
          studentProfileId,
          conversationId,
          kind:
            signal
              ? "BEHAVIOR_HYPOTHESIS"
              : "DAILY_STATE",
          question,
          options:
            options as
              Prisma.InputJsonValue,
          hypothesis:
            signal
              ? {
                  signalId:
                    signal.id,
                  signalType:
                    signal.type,
                  title:
                    signal.title,
                  confidenceScore:
                    signal
                      .confidenceScore,
                  dataConfidence:
                    signal
                      .dataConfidence,
                  diagnosis:
                    false,
                } as
                  Prisma.InputJsonValue
              : {
                  diagnosis:
                    false,
                } as
                  Prisma.InputJsonValue,
        },
        include: {
          response:
            true,
        },
      });
  }

  private async generateReply(
    studentProfileId:
      string,
    userMessage:
      string,
    context:
      MentorContext,
    history:
      Array<{
        role:
          "user" |
          "assistant";
        content:
          string;
      }>,
  ) {
    if (
      this.providerName ===
      "mock"
    ) {
      return {
        provider:
          "mock" as const,
        model:
          this.model,
        text:
          this.ruleBasedReply(
            userMessage,
            context,
          ),
        inputTokens:
          null,
        outputTokens:
          null,
      };
    }

    try {
      return await this.provider
        .generateText({
          instructions:
            this.mentorInstructions(),
          messages: [
            ...history,
            {
              role:
                "user",
              content: [
                userMessage,
                "",
                "Current structured AIMERS context:",
                JSON.stringify(
                  this.contextForStorage(
                    context,
                  ),
                ),
              ].join(
                "\n",
              ),
            },
          ],
          maxOutputTokens:
            1000,
          safetyIdentifier:
            studentProfileId,
        });
    } catch (
      error
    ) {
      if (
        error instanceof
        AiProviderError
      ) {
        return {
          provider:
            "mock" as const,
          model:
            this.model,
          text:
            this.ruleBasedReply(
              userMessage,
              context,
            ),
          inputTokens:
            null,
          outputTokens:
            null,
        };
      }

      throw error;
    }
  }

  private mentorInstructions() {
    return [
      "You are AIMERS AI Mentor, a supportive daily learning companion and teacher.",
      "Use only the structured context supplied by AIMERS and the student's own messages.",
      "Cooperate with Behavior AI: explain observed patterns, confidence, and evidence without claiming to read thoughts.",
      "Treat mindset explanations as hypotheses and ask the student to confirm difficulty, tiredness, boredom, stress, interruption, or another cause.",
      "Give one clear next action, a reason, and a realistic duration.",
      "Use planner tasks, academic priorities, behavior signals, intelligence scores, and open interventions.",
      "Never diagnose a medical or psychological condition.",
      "When detailedActivity.enabled is true, you may use the supplied event-level activity evidence, page titles, domains, timestamps, sequences, and sanitized URLs.",
      "When the student asks for an exact pattern, report available event counts, the observed time window, repeated transitions, category counts, and a short timestamped sequence without inventing missing evidence.",
      "Never claim unsanitized URLs, passwords, authentication tokens, payment details, typed form content, or private external chats are in context.",
      "Do not imply push notifications or background collectors are active unless the product explicitly confirms them.",
      "Be warm, direct, practical, and concise.",
    ].join(
      "\n",
    );
  }

  private ruleBasedReply(
    userMessage:
      string,
    context:
      MentorContext,
  ) {
    const task =
      context.taskSummary
        .nextTask;

    const signal =
      context.behavior
        .signals[0];

    const guidance =
      context.guidance[0];

    const nextAction =
      task
        ? `Start "${task.title}" for ${Math.min(task.estimatedMinutes, 45)} minutes.`
        : guidance
          ? guidance.message
          : "Choose one small study task and complete a protected 25-minute focus block.";

    const evidence =
      signal
        ? `Behavior AI currently shows "${signal.title}" with ${confidencePercent(signal.confidenceScore)}% confidence.`
        : context.behavior
            .latestScores
          ? `Your latest focus score is ${context.behavior.latestScores.focusScore ?? "not yet available"} and the current evidence coverage is ${Math.round(context.behavior.latestScores.coveragePercent)}%.`
          : "AIMERS does not yet have enough behavior evidence for a strong conclusion.";

    const detailedEvidence =
      this.detailedEvidenceNarrative(
        userMessage,
        context,
      );

    return [
      "I’m with you.",
      "",
      `You said: “${userMessage.slice(0, 240)}”`,
      "",
      `What I can verify: ${evidence}`,
      ...(
        detailedEvidence
          ? [
              "",
              "Detailed activity evidence:",
              detailedEvidence,
            ]
          : []
      ),
      "",
      `Your next action: ${nextAction}`,
      "",
      signal
        ? "Before I adjust the plan, tell me what best explains this pattern: topic difficulty, tiredness, boredom, stress, external interruption, or something else?"
        : "Tell me your current energy and focus from 1–5, and I’ll adjust the plan.",
    ].join(
      "\n",
    );
  }

  // AIMERS_AI_MENTOR_DETAILED_EVIDENCE_EXPLANATION_V1
  private detailedEvidenceNarrative(
    userMessage:
      string,
    context:
      MentorContext,
  ): string | null {
    const detailed =
      context.detailedActivity;

    if (
      !detailed.enabled ||
      detailed.events.length ===
        0
    ) {
      return null;
    }

    const asksForDetail =
      /(?:exact|detail|evidence|pattern|timeline|switch|drift|why|when|route|domain|url|activity)/i
        .test(
          userMessage,
        );

    if (!asksForDetail) {
      return [
        `AIMERS reviewed ${detailed.includedEventCount} permitted event-level records`,
        detailed.sanitizedUrlCount >
          0
          ? `and ${detailed.sanitizedUrlCount} sanitized URLs`
          : "with no sanitized URL evidence",
        "inside the current seven-day context window.",
      ].join(
        " ",
      );
    }

    const events =
      detailed.events
        .filter(
          (
            event,
          ) =>
            Boolean(
              event.startedAt,
            ),
        );

    if (
      events.length ===
        0
    ) {
      return `AIMERS has ${detailed.includedEventCount} permitted records, but none currently contain a usable event timestamp for sequence analysis.`;
    }

    const labelled =
      events
        .map(
          (
            event,
          ) => ({
            label:
              this.detailedActivityLabel(
                event,
              ),
            category:
              event.category ??
              event.eventType,
            startedAt:
              event.startedAt,
          }),
        )
        .filter(
          (
            item,
          ) =>
            Boolean(
              item.label,
            ),
        ) as Array<{
          label:
            string;
          category:
            string | null;
          startedAt:
            string;
        }>;

    const transitionCounts =
      new Map<
        string,
        {
          from:
            string;
          to:
            string;
          count:
            number;
        }
      >();

    let distinctSwitches =
      0;

    let rapidSwitches =
      0;

    for (
      let index =
        1;
      index <
        labelled.length;
      index +=
        1
    ) {
      const previous =
        labelled[
          index -
          1
        ];

      const current =
        labelled[
          index
        ];

      if (
        previous.label ===
        current.label
      ) {
        continue;
      }

      distinctSwitches +=
        1;

      const key =
        `${previous.label}\u0000${current.label}`;

      const stored =
        transitionCounts
          .get(
            key,
          );

      transitionCounts
        .set(
          key,
          {
            from:
              previous.label,
            to:
              current.label,
            count:
              (
                stored
                  ?.count ??
                0
              ) +
                1,
          },
        );

      const previousTime =
        new Date(
          previous.startedAt,
        )
          .getTime();

      const currentTime =
        new Date(
          current.startedAt,
        )
          .getTime();

      if (
        Number.isFinite(
          previousTime,
        ) &&
        Number.isFinite(
          currentTime,
        ) &&
        currentTime >=
          previousTime &&
        currentTime -
          previousTime <=
          5 *
            60 *
            1000
      ) {
        rapidSwitches +=
          1;
      }
    }

    const topTransitions =
      [
        ...transitionCounts
          .values(),
      ]
        .sort(
          (
            left,
            right,
          ) =>
            right.count -
            left.count,
        )
        .slice(
          0,
          3,
        );

    const categoryCounts =
      new Map<
        string,
        number
      >();

    for (
      const item
      of labelled
    ) {
      if (!item.category) {
        continue;
      }

      categoryCounts
        .set(
          item.category,
          (
            categoryCounts
              .get(
                item.category,
              ) ??
            0
          ) +
            1,
        );
    }

    const topCategories =
      [
        ...categoryCounts
          .entries(),
      ]
        .sort(
          (
            left,
            right,
          ) =>
            right[1] -
            left[1],
        )
        .slice(
          0,
          4,
        );

    const collapsedSequence:
      Array<{
        label:
          string;
        startedAt:
          string;
      }> =
        [];

    for (
      const item
      of labelled
    ) {
      const previous =
        collapsedSequence[
          collapsedSequence.length -
          1
        ];

      if (
        previous
          ?.label ===
        item.label
      ) {
        continue;
      }

      collapsedSequence
        .push({
          label:
            item.label,
          startedAt:
            item.startedAt,
        });
    }

    const sampleSequence =
      collapsedSequence
        .slice(
          -6,
        )
        .map(
          (
            item,
          ) =>
            `${this.evidenceTime(item.startedAt)} ${item.label}`,
        )
        .join(
          " → ",
        );

    const firstTime =
      labelled[0]
        ?.startedAt;

    const lastTime =
      labelled[
        labelled.length -
        1
      ]
        ?.startedAt;

    const lines =
      [
        `Window: ${this.evidenceTime(firstTime)} to ${this.evidenceTime(lastTime)}. AIMERS used ${detailed.includedEventCount} permitted records and ${detailed.sanitizedUrlCount} sanitized URLs.`,
        distinctSwitches >
          0
          ? `Observed ${distinctSwitches} distinct page, route, app, or activity-label changes; ${rapidSwitches} occurred within five minutes of the previous labelled event.`
          : "No distinct labelled transition was found in the available events.",
        topTransitions.length >
          0
          ? `Most repeated transitions: ${topTransitions.map((item) => `${item.from} → ${item.to} (${item.count}×)`).join("; ")}.`
          : null,
        topCategories.length >
          0
          ? `Most represented categories or event types: ${topCategories.map(([name, count]) => `${name} (${count})`).join(", ")}.`
          : null,
        sampleSequence
          ? `Recent observed sequence: ${sampleSequence}.`
          : null,
        "This evidence supports the switching pattern; it does not prove whether the cause was difficulty, tiredness, boredom, stress, or an external interruption.",
      ]
        .filter(
          (
            line,
          ):
            line is
              string =>
              Boolean(
                line,
              ),
        );

    return lines.join(
      "\n",
    );
  }

  private detailedActivityLabel(
    event:
      DetailedActivityContext[
        "events"
      ][number],
  ): string {
    const urlLabel =
      this.sanitizedUrlLabel(
        event.sanitizedUrl,
      );

    const value =
      event.pageTitle ??
      event.domain ??
      event.appName ??
      urlLabel ??
      event.eventType ??
      event.category ??
      "activity";

    const compact =
      value
        .replace(
          /\s+/g,
          " ",
        )
        .trim();

    return compact.length >
      72
      ? `${compact.slice(0, 69)}…`
      : compact;
  }

  private sanitizedUrlLabel(
    value:
      string | null,
  ): string | null {
    if (!value) {
      return null;
    }

    try {
      const parsed =
        new URL(
          value,
          "https://aimers.local",
        );

      const host =
        parsed.hostname ===
          "aimers.local"
          ? ""
          : parsed.hostname;

      const path =
        parsed.pathname ===
          "/"
          ? ""
          : parsed.pathname;

      return (
        [
          host,
          path,
        ]
          .filter(
            Boolean,
          )
          .join(
            "",
          ) ||
        "AIMERS route"
      );
    } catch {
      return value
        .split(
          "?",
          1,
        )[0]
        .slice(
          0,
          72,
        );
    }
  }

  private evidenceTime(
    value:
      string |
      null |
      undefined,
  ): string {
    if (!value) {
      return "time unavailable";
    }

    const parsed =
      new Date(
        value,
      );

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return "time unavailable";
    }

    return (
      parsed
        .toISOString()
        .slice(
          0,
          16,
        )
        .replace(
          "T",
          " ",
        ) +
      " UTC"
    );
  }

  private briefDraft(
    context:
      MentorContext,
  ) {
    const task =
      context.taskSummary
        .nextTask;

    const signal =
      context.behavior
        .signals[0];

    const score =
      context.behavior
        .latestScores;

    const priorities =
      context.taskSummary
        .tasks
        .slice(
          0,
          3,
        )
        .map(
          (item) => ({
            title:
              item.title,
            subject:
              item.subject,
            priority:
              item.priority,
            estimatedMinutes:
              item
                .estimatedMinutes,
            dueAt:
              item.dueAt,
          }),
        );

    const risks =
      [
        ...context.behavior
          .signals
          .slice(
            0,
            3,
          )
          .map(
            (item) => ({
              title:
                item.title,
              severity:
                item.severity,
              confidenceScore:
                item
                  .confidenceScore,
              explanation:
                item.description,
            }),
          ),
        ...(
          context
            .taskSummary
            .overdue >
          0
            ? [
                {
                  title:
                    "Overdue study tasks",
                  severity:
                    "MEDIUM",
                  confidenceScore:
                    100,
                  explanation:
                    `${context.taskSummary.overdue} active task(s) are past their due time.`,
                },
              ]
            : []
        ),
      ];

    const nextActions =
      task
        ? [
            {
              title:
                task.title,
              durationMinutes:
                Math.min(
                  task
                    .estimatedMinutes,
                  45,
                ),
              reason:
                signal
                  ?.recommendedAction ??
                "This is the highest current planner priority.",
            },
          ]
        : [
            {
              title:
                "Create one small study task",
              durationMinutes:
                25,
              reason:
                "No active planner task is available.",
            },
          ];

    const headline =
      signal
        ? signal.title
        : task
          ? `Start with ${task.title}`
          : "Build today around one clear action";

    const summary =
      [
        task
          ? `Your highest current planner priority is "${task.title}".`
          : "No active planner task is available.",
        signal
          ? ` Behavior AI detected "${signal.title}" with ${confidencePercent(signal.confidenceScore)}% confidence.`
          : "",
        score
          ? ` Current focus score: ${score.focusScore ?? "not available"}; evidence coverage: ${Math.round(score.coveragePercent)}%.`
          : "",
        " AIMERS will use a voluntary check-in before treating a possible mindset explanation as confirmed.",
      ].join("");

    return {
      headline,
      summary,
      priorities,
      risks,
      nextActions,
    };
  }

  private contextForStorage(
    context:
      MentorContext,
  ) {
    return {
      generatedAt:
        context.generatedAt,
      taskSummary:
        context.taskSummary,
      behavior:
        context.behavior,
      detailedActivity:
        context.detailedActivity as unknown as
          Prisma.InputJsonValue,
      guidance:
        context.guidance,
      privacy:
        context.privacy,
      excluded: {
        rawActivity:
          !context
            .detailedActivity
            .enabled,
        unsanitizedUrls:
          true,
        fullUrls:
          context
            .detailedActivity
            .sanitizedUrlCount ===
            0,
        passwordsAndTokens:
          true,
        typedFormContent:
          true,
        privateExternalChats:
          true,
      },
    };
  }

  private dateForTimezone(
    timezone:
      string,
  ) {
    try {
      const parts =
        new Intl
          .DateTimeFormat(
            "en-CA",
            {
              timeZone:
                timezone,
              year:
                "numeric",
              month:
                "2-digit",
              day:
                "2-digit",
            },
          )
          .formatToParts(
            new Date(),
          );

      const values =
        Object.fromEntries(
          parts.map(
            (part) => [
              part.type,
              part.value,
            ],
          ),
        );

      return new Date(
        `${values.year}-${values.month}-${values.day}T00:00:00.000Z`,
      );
    } catch {
      return new Date(
        new Date()
          .toISOString()
          .slice(
            0,
            10,
          ) +
        "T00:00:00.000Z",
      );
    }
  }

  private conversationTitle(
    content:
      string,
  ) {
    const title =
      content
        .replace(
          /\s+/g,
          " ",
        )
        .trim()
        .slice(
          0,
          70,
        );

    return title ||
      "Daily Mentor";
  }
}

// AIMERS_DETAILED_AI_CONTEXT_POLICY_V3
