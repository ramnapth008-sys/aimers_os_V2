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

interface ConsentBoundPreference {
  field:
    | "monitoringEnabled"
    | "backgroundMonitoring"
    | "crossDeviceSync"
    | "storeRawActivity"
    | "storeFullUrls"
    | "importPastHistory"
    | "allowAiContext"
    | "allowBehaviorAnalysis"
    | "allowNotifications"
    | "allowFocusControls";

  scope:
    ConsentScope;
}

const CONSENT_BOUND_PREFERENCES:
  ConsentBoundPreference[] = [
    {
      field:
        "monitoringEnabled",
      scope:
        ConsentScope.DIGITAL_ACTIVITY_MONITORING,
    },
    {
      field:
        "backgroundMonitoring",
      scope:
        ConsentScope.DIGITAL_ACTIVITY_MONITORING,
    },
    {
      field:
        "crossDeviceSync",
      scope:
        ConsentScope.CROSS_DEVICE_SYNC,
    },
    {
      field:
        "storeRawActivity",
      scope:
        ConsentScope.DIGITAL_ACTIVITY_MONITORING,
    },
    {
      field:
        "storeFullUrls",
      scope:
        ConsentScope.BROWSER_ACTIVITY,
    },
    {
      field:
        "importPastHistory",
      scope:
        ConsentScope.BROWSER_HISTORY_IMPORT,
    },
    {
      field:
        "allowAiContext",
      scope:
        ConsentScope.AI_CONTEXT_SHARING,
    },
    {
      field:
        "allowBehaviorAnalysis",
      scope:
        ConsentScope.BEHAVIOR_ANALYSIS,
    },
    {
      field:
        "allowNotifications",
      scope:
        ConsentScope.NOTIFICATIONS,
    },
    {
      field:
        "allowFocusControls",
      scope:
        ConsentScope.FOCUS_CONTROLS,
    },
  ];

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

    const preference =
      await this.database
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

    return this.reconcileWithConsent(
      profile.id,
      preference,
    );
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

    const preference =
      await this.database
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

    return this.reconcileWithConsent(
      profile.id,
      preference,
    );
  }

  private async reconcileWithConsent(
    studentProfileId: string,
    preference: {
      monitoringEnabled:
        boolean;
      backgroundMonitoring:
        boolean;
      crossDeviceSync:
        boolean;
      storeRawActivity:
        boolean;
      storeFullUrls:
        boolean;
      importPastHistory:
        boolean;
      allowAiContext:
        boolean;
      allowBehaviorAnalysis:
        boolean;
      allowNotifications:
        boolean;
      allowFocusControls:
        boolean;
    },
  ) {
    const activeScopes =
      await this.consentService
        .activeScopesForProfile(
          studentProfileId,
        );

    const update: {
      monitoringEnabled?:
        boolean;
      backgroundMonitoring?:
        boolean;
      crossDeviceSync?:
        boolean;
      storeRawActivity?:
        boolean;
      storeFullUrls?:
        boolean;
      importPastHistory?:
        boolean;
      allowAiContext?:
        boolean;
      allowBehaviorAnalysis?:
        boolean;
      allowNotifications?:
        boolean;
      allowFocusControls?:
        boolean;
      pausedAt?:
        Date;
    } = {};

    for (
      const binding
      of CONSENT_BOUND_PREFERENCES
    ) {
      if (
        preference[
          binding.field
        ] &&
        !activeScopes.has(
          binding.scope,
        )
      ) {
        update[
          binding.field
        ] = false;
      }
    }

    if (
      preference.monitoringEnabled &&
      !activeScopes.has(
        ConsentScope.DIGITAL_ACTIVITY_MONITORING,
      )
    ) {
      update.pausedAt =
        new Date();
    }

    if (
      Object.keys(
        update,
      ).length === 0
    ) {
      return preference;
    }

    return this.database
      .privacyPreference
      .update({
        where: {
          studentProfileId,
        },

        data:
          update,
      });
  }
}
