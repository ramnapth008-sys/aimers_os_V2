import {
  Inject,
  Injectable,
} from "@nestjs/common";

import {
  ConsentScope,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import {
  ConsentService,
} from "../consent/consent.service";

import type {
  UpdatePrivacyPreferencesDto,
} from "./dto/update-privacy-preferences.dto";

@Injectable()
export class PrivacyService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(ConsentService)
    private readonly consentService:
      ConsentService,
  ) {}

  async get(
    userId: string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    return this.database
      .privacyPreference
      .upsert({
        where: {
          studentProfileId:
            profile.id,
        },

        update: {},

        create: {
          studentProfileId:
            profile.id,
        },
      });
  }

  async update(
    userId: string,
    dto:
      UpdatePrivacyPreferencesDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const requiredScopes:
      Array<
        [
          boolean | undefined,
          ConsentScope,
        ]
      > = [
        [
          dto.monitoringEnabled,
          ConsentScope.DIGITAL_ACTIVITY_MONITORING,
        ],
        [
          dto.backgroundMonitoring,
          ConsentScope.DIGITAL_ACTIVITY_MONITORING,
        ],
        [
          dto.crossDeviceSync,
          ConsentScope.CROSS_DEVICE_SYNC,
        ],
        [
          dto.storeRawActivity,
          ConsentScope.DIGITAL_ACTIVITY_MONITORING,
        ],
        [
          dto.storeFullUrls,
          ConsentScope.BROWSER_ACTIVITY,
        ],
        [
          dto.importPastHistory,
          ConsentScope.BROWSER_HISTORY_IMPORT,
        ],
        [
          dto.allowAiContext,
          ConsentScope.AI_CONTEXT_SHARING,
        ],
        [
          dto.allowBehaviorAnalysis,
          ConsentScope.BEHAVIOR_ANALYSIS,
        ],
        [
          dto.allowNotifications,
          ConsentScope.NOTIFICATIONS,
        ],
        [
          dto.allowFocusControls,
          ConsentScope.FOCUS_CONTROLS,
        ],
      ];

    for (
      const [
        enabled,
        scope,
      ]
      of requiredScopes
    ) {
      if (enabled === true) {
        await this.consentService
          .assertScopeActiveForProfile(
            profile.id,
            scope,
          );
      }
    }

    const monitoringChanged =
      dto.monitoringEnabled !==
      undefined;

    return this.database
      .privacyPreference
      .upsert({
        where: {
          studentProfileId:
            profile.id,
        },

        create: {
          studentProfileId:
            profile.id,
          ...dto,

          pausedAt:
            dto.monitoringEnabled ===
            true
              ? null
              : dto.monitoringEnabled ===
                  false
                ? new Date()
                : undefined,
        },

        update: {
          ...dto,

          ...(monitoringChanged
            ? {
                pausedAt:
                  dto.monitoringEnabled
                    ? null
                    : new Date(),
              }
            : {}),
        },
      });
  }
}
