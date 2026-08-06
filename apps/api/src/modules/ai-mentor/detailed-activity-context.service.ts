import {
  createHash,
} from "node:crypto";

import {
  Inject,
  Injectable,
} from "@nestjs/common";

import {
  ConfigService,
} from "@nestjs/config";

import {
  type Prisma,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

const POLICY_VERSION =
  "aimers-privacy-data-v3";

const CONTEXT_DAYS =
  7;

const EVENT_LIMIT =
  250;

const SENSITIVE_QUERY_KEY =
  /(?:token|auth|access|refresh|session|sid|password|passwd|pwd|secret|api[_-]?key|key|signature|sig|jwt|otp|email|phone|mobile|payment|card|cvv|code|state)/i;

const SENSITIVE_TEXT =
  /(?:bearer\s+[a-z0-9._-]+|eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}|(?:token|password|secret|otp|cvv)\s*[:=]\s*\S+)/gi;

type UnknownRecord =
  Record<
    string,
    unknown
  >;

export interface DetailedActivityEvent {
  id:
    string;
  source:
    string | null;
  category:
    string | null;
  confidence:
    string | null;
  eventType:
    string | null;
  appName:
    string | null;
  domain:
    string | null;
  pageTitle:
    string | null;
  sanitizedUrl:
    string | null;
  startedAt:
    string | null;
  endedAt:
    string | null;
  durationSeconds:
    number | null;
  foreground:
    boolean | null;
}

export interface DetailedActivityContext {
  enabled:
    boolean;
  reason:
    string | null;
  policyVersion:
    string;
  agreementAcceptedAt:
    string | null;
  windowStart:
    string;
  windowEnd:
    string;
  rawEventCount:
    number;
  includedEventCount:
    number;
  fullUrlCount:
    number;
  sanitizedUrlCount:
    number;
  redactedValueCount:
    number;
  auditId:
    string | null;
  events:
    DetailedActivityEvent[];
}

@Injectable()
export class DetailedActivityContextService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(ConfigService)
    private readonly configService:
      ConfigService,
  ) {}

  // AIMERS_DETAILED_AI_CONTEXT_POLICY_V3
  async build(
    studentProfileId:
      string,
  ): Promise<DetailedActivityContext> {
    const windowEnd =
      new Date();

    const windowStart =
      new Date(
        windowEnd.getTime() -
        CONTEXT_DAYS *
          24 *
          60 *
          60 *
          1000,
      );

    const [
      privacy,
      acceptance,
    ] =
      await Promise.all([
        this.database
          .privacyPreference
          .findUnique({
            where: {
              studentProfileId,
            },
          }),

        this.database
          .privacyAgreementAcceptance
          .findUnique({
            where: {
              studentProfileId_policyVersion: {
                studentProfileId,
                policyVersion:
                  POLICY_VERSION,
              },
            },
          }),
      ]);

    const disabled =
      (
        reason:
          string,
      ): DetailedActivityContext => ({
        enabled:
          false,
        reason,
        policyVersion:
          POLICY_VERSION,
        agreementAcceptedAt:
          acceptance
            ?.acceptedAt
            .toISOString() ??
          null,
        windowStart:
          windowStart
            .toISOString(),
        windowEnd:
          windowEnd
            .toISOString(),
        rawEventCount:
          0,
        includedEventCount:
          0,
        fullUrlCount:
          0,
        sanitizedUrlCount:
          0,
        redactedValueCount:
          0,
        auditId:
          null,
        events:
          [],
      });

    if (!acceptance) {
      return disabled(
        "Privacy Policy V3 has not been accepted.",
      );
    }

    if (
      !privacy
        ?.allowAiContext
    ) {
      return disabled(
        "AI Mentor context is disabled.",
      );
    }

    if (
      !privacy
        .storeRawActivity
    ) {
      return disabled(
        "Raw activity storage is disabled.",
      );
    }

    const rawEvents =
      await this.database
        .activityEvent
        .findMany({
          where: {
            studentProfileId,
            startedAt: {
              gte:
                windowStart,
              lte:
                windowEnd,
            },
          },
          orderBy: [
            {
              startedAt:
                "desc",
            },
            {
              createdAt:
                "desc",
            },
          ],
          take:
            EVENT_LIMIT,
        });

    let fullUrlCount =
      0;

    let sanitizedUrlCount =
      0;

    let redactedValueCount =
      0;

    const sourceCounts =
      new Map<
        string,
        number
      >();

    const categoryCounts =
      new Map<
        string,
        number
      >();

    const events =
      rawEvents
        .map(
          (
            raw,
          ):
            DetailedActivityEvent => {
            const event =
              raw as unknown as
                UnknownRecord;

            const metadata =
              this.recordValue(
                event.metadata,
              );

            const source =
              this.stringValue(
                event.source,
              );

            const category =
              this.stringValue(
                event.category,
              );

            if (source) {
              sourceCounts.set(
                source,
                (
                  sourceCounts.get(
                    source,
                  ) ??
                  0
                ) +
                  1,
              );
            }

            if (category) {
              categoryCounts.set(
                category,
                (
                  categoryCounts.get(
                    category,
                  ) ??
                  0
                ) +
                  1,
              );
            }

            const rawUrl =
              this.firstString(
                event.fullUrl,
                event.url,
                event.pageUrl,
                event.routeUrl,
                metadata.fullUrl,
                metadata.url,
                metadata.pageUrl,
                metadata.href,
                metadata.route,
              );

            if (rawUrl) {
              fullUrlCount +=
                1;
            }

            const sanitized =
              privacy
                .storeFullUrls
                ? this.sanitizeUrl(
                    rawUrl,
                  )
                : {
                    value:
                      null,
                    redacted:
                      0,
                  };

            redactedValueCount +=
              sanitized
                .redacted;

            if (
              sanitized.value
            ) {
              sanitizedUrlCount +=
                1;
            }

            const pageTitle =
              this.redactText(
                this.firstString(
                  event.pageTitle,
                  event.title,
                  event.windowTitle,
                  metadata.pageTitle,
                  metadata.title,
                  metadata.documentTitle,
                ),
                240,
              );

            redactedValueCount +=
              pageTitle
                .redacted;

            return {
              id:
                this.stringValue(
                  event.id,
                ) ??
                "unknown",
              source,
              category,
              confidence:
                this.stringValue(
                  event.confidence,
                ),
              eventType:
                this.firstString(
                  event.eventType,
                  event.type,
                  metadata.eventType,
                  metadata.type,
                  metadata.kind,
                ),
              appName:
                this.redactText(
                  this.firstString(
                    event.appName,
                    event.applicationName,
                    metadata.appName,
                    metadata.applicationName,
                  ),
                  160,
                ).value,
              domain:
                this.firstString(
                  event.domain,
                  metadata.domain,
                  this.domainFromUrl(
                    sanitized.value,
                  ),
                ),
              pageTitle:
                pageTitle
                  .value,
              sanitizedUrl:
                sanitized
                  .value,
              startedAt:
                this.dateString(
                  event.startedAt,
                ),
              endedAt:
                this.dateString(
                  event.endedAt,
                ),
              durationSeconds:
                this.numberValue(
                  event.durationSeconds,
                ),
              foreground:
                this.booleanValue(
                  event.foreground,
                ),
            };
          },
        )
        .reverse();

    const sourceSummary =
      {
        sources:
          Object.fromEntries(
            sourceCounts,
          ),
        categories:
          Object.fromEntries(
            categoryCounts,
          ),
      };

    const sanitizationSummary =
      {
        queryParametersRemoved:
          redactedValueCount,
        fragmentsRemoved:
          true,
        credentialsRemoved:
          true,
        typedContentIncluded:
          false,
        passwordsIncluded:
          false,
        authenticationTokensIncluded:
          false,
        paymentDetailsIncluded:
          false,
        privateMessagesIncluded:
          false,
      };

    const digestInput =
      JSON.stringify({
        studentProfileId,
        policyVersion:
          POLICY_VERSION,
        eventIds:
          events.map(
            (
              event,
            ) =>
              event.id,
          ),
        urls:
          events.map(
            (
              event,
            ) =>
              event.sanitizedUrl,
          ),
      });

    const payloadHash =
      createHash(
        "sha256",
      )
        .update(
          digestInput,
        )
        .digest(
          "hex",
        );

    const recentAudit =
      await this.database
        .mentorContextAudit
        .findFirst({
          where: {
            studentProfileId,
            purpose:
              "AI_MENTOR_CONTEXT",
            payloadHash,
            createdAt: {
              gte:
                new Date(
                  Date.now() -
                  5 *
                    60 *
                    1000,
                ),
            },
          },
          orderBy: {
            createdAt:
              "desc",
          },
        });

    const audit =
      recentAudit ??
      await this.database
        .mentorContextAudit
        .create({
          data: {
            studentProfileId,
            purpose:
              "AI_MENTOR_CONTEXT",
            policyVersion:
              POLICY_VERSION,
            consentScope:
              "AI_CONTEXT_SHARING",
            agreementAcceptedAt:
              acceptance
                .acceptedAt,
            windowStart,
            windowEnd,
            rawEventCount:
              rawEvents
                .length,
            includedEventCount:
              events.length,
            fullUrlCount,
            sanitizedUrlCount,
            redactedValueCount,
            includedEventIds:
              events.map(
                (
                  event,
                ) =>
                  event.id,
              ) as
                Prisma.InputJsonValue,
            sourceSummary:
              sourceSummary as
                Prisma.InputJsonValue,
            sanitizationSummary:
              sanitizationSummary as
                Prisma.InputJsonValue,
            payloadHash,
            provider:
              this.configService
                .get<string>(
                  "AI_PROVIDER",
                ) ??
              null,
            model:
              this.configService
                .get<string>(
                  "AI_MODEL",
                ) ??
              null,
          },
        });

    return {
      enabled:
        true,
      reason:
        null,
      policyVersion:
        POLICY_VERSION,
      agreementAcceptedAt:
        acceptance
          .acceptedAt
          .toISOString(),
      windowStart:
        windowStart
          .toISOString(),
      windowEnd:
        windowEnd
          .toISOString(),
      rawEventCount:
        rawEvents.length,
      includedEventCount:
        events.length,
      fullUrlCount,
      sanitizedUrlCount,
      redactedValueCount,
      auditId:
        audit.id,
      events,
    };
  }

  private sanitizeUrl(
    raw:
      string | null,
  ) {
    if (!raw) {
      return {
        value:
          null,
        redacted:
          0,
      };
    }

    const trimmed =
      raw
        .trim()
        .slice(
          0,
          3000,
        );

    if (
      !trimmed ||
      /^(?:javascript|data|file|blob):/i
        .test(
          trimmed,
        )
    ) {
      return {
        value:
          null,
        redacted:
          1,
      };
    }

    try {
      const relative =
        trimmed.startsWith(
          "/",
        );

      const parsed =
        new URL(
          trimmed,
          relative
            ? "https://aimers.local"
            : undefined,
        );

      if (
        ![
          "http:",
          "https:",
        ].includes(
          parsed.protocol,
        )
      ) {
        return {
          value:
            null,
          redacted:
            1,
        };
      }

      let redacted =
        0;

      if (
        parsed.username ||
        parsed.password
      ) {
        parsed.username =
          "";
        parsed.password =
          "";
        redacted +=
          1;
      }

      for (
        const key
        of [
          ...parsed
            .searchParams
            .keys(),
        ]
      ) {
        const value =
          parsed
            .searchParams
            .get(
              key,
            ) ??
          "";

        if (
          SENSITIVE_QUERY_KEY
            .test(
              key,
            ) ||
          this.looksSecret(
            value,
          )
        ) {
          parsed
            .searchParams
            .set(
              key,
              "[REDACTED]",
            );
          redacted +=
            1;
        }
      }

      if (parsed.hash) {
        parsed.hash =
          "";
        redacted +=
          1;
      }

      const value =
        relative
          ? (
              parsed.pathname +
              parsed.search
            )
          : parsed.toString();

      return {
        value:
          value.slice(
            0,
            1200,
          ),
        redacted,
      };
    } catch {
      const redacted =
        this.redactText(
          trimmed,
          1200,
        );

      return {
        value:
          redacted.value,
        redacted:
          redacted.redacted,
      };
    }
  }

  private redactText(
    value:
      string | null,
    maximum:
      number,
  ) {
    if (!value) {
      return {
        value:
          null,
        redacted:
          0,
      };
    }

    let redacted =
      0;

    const cleaned =
      value
        .replace(
          SENSITIVE_TEXT,
          () => {
            redacted +=
              1;
            return "[REDACTED]";
          },
        )
        .slice(
          0,
          maximum,
        );

    return {
      value:
        cleaned ||
        null,
      redacted,
    };
  }

  private looksSecret(
    value:
      string,
  ) {
    return (
      value.length >
        80 ||
      /^eyJ[a-zA-Z0-9_-]+\./
        .test(
          value,
        ) ||
      /^[a-f0-9]{32,}$/i
        .test(
          value,
        )
    );
  }

  private recordValue(
    value:
      unknown,
  ): UnknownRecord {
    return (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value,
      )
    )
      ? value as
          UnknownRecord
      : {};
  }

  private firstString(
    ...values:
      unknown[]
  ) {
    for (
      const value
      of values
    ) {
      const converted =
        this.stringValue(
          value,
        );

      if (converted) {
        return converted;
      }
    }

    return null;
  }

  private stringValue(
    value:
      unknown,
  ) {
    return typeof value ===
      "string" &&
      value.trim()
      ? value.trim()
      : null;
  }

  private numberValue(
    value:
      unknown,
  ) {
    return typeof value ===
      "number" &&
      Number.isFinite(
        value,
      )
      ? value
      : null;
  }

  private booleanValue(
    value:
      unknown,
  ) {
    return typeof value ===
      "boolean"
      ? value
      : null;
  }

  private dateString(
    value:
      unknown,
  ) {
    if (
      value instanceof
      Date
    ) {
      return value
        .toISOString();
    }

    if (
      typeof value ===
        "string"
    ) {
      const parsed =
        new Date(
          value,
        );

      return Number.isNaN(
        parsed.getTime(),
      )
        ? null
        : parsed
            .toISOString();
    }

    return null;
  }

  private domainFromUrl(
    value:
      string | null,
  ) {
    if (!value) {
      return null;
    }

    try {
      return new URL(
        value,
        "https://aimers.local",
      ).hostname;
    } catch {
      return null;
    }
  }
}
