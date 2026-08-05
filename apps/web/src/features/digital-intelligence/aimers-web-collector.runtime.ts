import {
  ingestCollectorEvents,
  loadCollectorReadiness,
  sendCollectorHeartbeat,
} from "./aimers-web-collector.service";

import type {
  ActivityCategory,
  ActivityEventType,
  ActivitySource,
  ApiFetch,
  CollectorActivityEvent,
  CollectorPrivacy,
  CollectorReadiness,
  CollectorRouteSnapshot,
  CollectorStatusDetail,
} from "./aimers-web-collector.types";

const DEVICE_STORAGE_KEY =
  "aimers-browser-device-id";

const SETTINGS_UPDATED_EVENT =
  "aimers:intelligence-settings-updated";

const ACTIVITY_INGESTED_EVENT =
  "aimers:activity-ingested";

const COLLECTOR_STATUS_EVENT =
  "aimers:web-collector-status";

const QUEUE_PREFIX =
  "aimers-web-collector-queue";

const MAX_QUEUE_SIZE =
  180;

const MAX_BATCH_SIZE =
  100;

const FLUSH_INTERVAL_MS =
  20_000;

const READINESS_INTERVAL_MS =
  60_000;

const IDLE_CHECK_INTERVAL_MS =
  1_000;

const IDLE_THRESHOLD_MS =
  60_000;

interface ActiveRouteSession {
  sessionId: string;
  route:
    CollectorRouteSnapshot;
  startedAtMs: number;
  activeStartedAtMs:
    number | null;
  activeMs: number;
  interruptionCount:
    number;
}

interface ActiveInterruption {
  startedAtMs:
    number;
  reason:
    "WINDOW_BLURRED" |
    "DOCUMENT_HIDDEN";
}

function uuid(): string {
  if (
    typeof crypto !==
      "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return (
    `${Date.now()}-`
    + `${Math.random()
      .toString(16)
      .slice(2)}`
  );
}

function clampSeconds(
  milliseconds:
    number,
): number {
  return Math.max(
    0,
    Math.min(
      604_800,
      Math.round(
        milliseconds /
        1_000,
      ),
    ),
  );
}

function safeRead(
  key:
    string,
): string | null {
  try {
    return window
      .localStorage
      .getItem(
        key,
      );
  } catch {
    return null;
  }
}

function safeWrite(
  key:
    string,
  value:
    string,
) {
  try {
    window
      .localStorage
      .setItem(
        key,
        value,
      );
  } catch {
    // The collector remains memory-safe when storage is unavailable.
  }
}

function safeRemove(
  key:
    string,
) {
  try {
    window
      .localStorage
      .removeItem(
        key,
      );
  } catch {
    // Nothing else is required.
  }
}

function routeCategory(
  pathname:
    string,
): ActivityCategory {
  const studyPrefixes = [
    "/subjects",
    "/planner",
    "/mock-tests",
    "/question-bank",
    "/flashcards",
    "/memory-engine",
    "/notes",
    "/research-ai",
  ];

  if (
    studyPrefixes.some(
      (prefix) =>
        pathname.startsWith(
          prefix,
        ),
    )
  ) {
    return "STUDY";
  }

  if (
    pathname.startsWith(
      "/community",
    )
  ) {
    return "COMMUNICATION";
  }

  const systemPrefixes = [
    "/settings",
    "/subscription",
    "/billing",
    "/help-support",
  ];

  if (
    systemPrefixes.some(
      (prefix) =>
        pathname.startsWith(
          prefix,
        ),
    )
  ) {
    return "SYSTEM";
  }

  return "PRODUCTIVITY";
}

function apiErrorStatus(
  error:
    unknown,
): number | null {
  if (
    typeof error ===
      "object" &&
    error !==
      null &&
    "status" in error &&
    typeof (
      error as {
        status?: unknown;
      }
    ).status ===
      "number"
  ) {
    return (
      error as {
        status: number;
      }
    ).status;
  }

  return null;
}

export class AimersWebCollectorRuntime {
  private readonly apiFetch:
    ApiFetch;

  private started =
    false;

  private ready =
    false;

  private readiness:
    CollectorReadiness | null =
    null;

  private privacy:
    CollectorPrivacy | null =
    null;

  private externalDeviceId:
    string | null =
    null;

  private deviceId:
    string | null =
    null;

  private connectorId:
    string | null =
    null;

  private route:
    CollectorRouteSnapshot | null =
    null;

  private activeSession:
    ActiveRouteSession | null =
    null;

  private interruption:
    ActiveInterruption | null =
    null;

  private idleStartedAtMs:
    number | null =
    null;

  private lastInteractionAtMs =
    Date.now();

  private lastPointerSignalAtMs =
    0;

  private flushInFlight =
    false;

  private readinessInFlight =
    false;

  private lastSyncAt:
    string | null =
    null;

  private flushTimer:
    ReturnType<
      typeof setInterval
    > | null =
    null;

  private readinessTimer:
    ReturnType<
      typeof setInterval
    > | null =
    null;

  private idleTimer:
    ReturnType<
      typeof setInterval
    > | null =
    null;

  constructor(
    apiFetch:
      ApiFetch,
  ) {
    this.apiFetch =
      apiFetch;
  }

  start() {
    if (this.started) {
      return;
    }

    this.started =
      true;

    window.addEventListener(
      "focus",
      this.handleFocus,
    );

    window.addEventListener(
      "blur",
      this.handleBlur,
    );

    window.addEventListener(
      "online",
      this.handleOnline,
    );

    window.addEventListener(
      "pagehide",
      this.handlePageHide,
    );

    window.addEventListener(
      "pageshow",
      this.handlePageShow,
    );

    window.addEventListener(
      "storage",
      this.handleStorage,
    );

    window.addEventListener(
      SETTINGS_UPDATED_EVENT,
      this.handleSettingsUpdated,
    );

    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    for (
      const eventName
      of [
        "pointerdown",
        "pointermove",
        "keydown",
        "scroll",
        "touchstart",
      ] as const
    ) {
      window.addEventListener(
        eventName,
        this.handleInteraction,
        {
          passive:
            true,
        },
      );
    }

    this.flushTimer =
      setInterval(
        () => {
          void this.flush();
        },
        FLUSH_INTERVAL_MS,
      );

    this.readinessTimer =
      setInterval(
        () => {
          void this.refreshReadiness();
        },
        READINESS_INTERVAL_MS,
      );

    this.idleTimer =
      setInterval(
        () => {
          this.checkIdle();
        },
        IDLE_CHECK_INTERVAL_MS,
      );

    void this
      .refreshReadiness();
  }

  stop() {
    if (!this.started) {
      return;
    }

    const now =
      Date.now();

    this.finishIdle(
      now,
    );

    this.finishInterruption(
      now,
    );

    this.finishRouteSession(
      now,
    );

    void this.flush();

    this.started =
      false;

    window.removeEventListener(
      "focus",
      this.handleFocus,
    );

    window.removeEventListener(
      "blur",
      this.handleBlur,
    );

    window.removeEventListener(
      "online",
      this.handleOnline,
    );

    window.removeEventListener(
      "pagehide",
      this.handlePageHide,
    );

    window.removeEventListener(
      "pageshow",
      this.handlePageShow,
    );

    window.removeEventListener(
      "storage",
      this.handleStorage,
    );

    window.removeEventListener(
      SETTINGS_UPDATED_EVENT,
      this.handleSettingsUpdated,
    );

    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    for (
      const eventName
      of [
        "pointerdown",
        "pointermove",
        "keydown",
        "scroll",
        "touchstart",
      ] as const
    ) {
      window.removeEventListener(
        eventName,
        this.handleInteraction,
      );
    }

    if (this.flushTimer) {
      clearInterval(
        this.flushTimer,
      );
    }

    if (
      this.readinessTimer
    ) {
      clearInterval(
        this.readinessTimer,
      );
    }

    if (this.idleTimer) {
      clearInterval(
        this.idleTimer,
      );
    }

    this.flushTimer =
      null;

    this.readinessTimer =
      null;

    this.idleTimer =
      null;

    this.emitStatus(
      "STOPPED",
    );
  }

  updateRoute(
    next:
      CollectorRouteSnapshot,
  ) {
    const currentKey =
      this.route
        ? this.routeKey(
            this.route,
          )
        : null;

    const nextKey =
      this.routeKey(
        next,
      );

    if (
      currentKey ===
      nextKey
    ) {
      this.route =
        next;

      if (
        this.activeSession
      ) {
        this.activeSession.route =
          next;
      }

      return;
    }

    const now =
      Date.now();

    this.finishIdle(
      now,
    );

    this.finishInterruption(
      now,
    );

    this.finishRouteSession(
      now,
    );

    this.route =
      next;

    this.lastInteractionAtMs =
      now;

    if (this.ready) {
      this.startRouteSession(
        now,
      );
    }
  }

  private readonly handleFocus =
    () => {
      const now =
        Date.now();

      this.lastInteractionAtMs =
        now;

      this.finishIdle(
        now,
      );

      this.finishInterruption(
        now,
      );

      this.syncActiveClock(
        now,
      );
    };

  private readonly handleBlur =
    () => {
      const now =
        Date.now();

      this.syncActiveClock(
        now,
      );

      this.startInterruption(
        now,
        "WINDOW_BLURRED",
      );
    };

  private readonly handleVisibilityChange =
    () => {
      const now =
        Date.now();

      this.syncActiveClock(
        now,
      );

      if (
        document.visibilityState ===
        "hidden"
      ) {
        this.startInterruption(
          now,
          "DOCUMENT_HIDDEN",
        );
      } else {
        this.lastInteractionAtMs =
          now;

        this.finishIdle(
          now,
        );

        this.finishInterruption(
          now,
        );

        this.syncActiveClock(
          now,
        );
      }
    };

  private readonly handleInteraction =
    (
      event:
        Event,
    ) => {
      const now =
        Date.now();

      if (
        event.type ===
          "pointermove" &&
        now -
          this.lastPointerSignalAtMs <
          1_000
      ) {
        return;
      }

      if (
        event.type ===
        "pointermove"
      ) {
        this.lastPointerSignalAtMs =
          now;
      }

      this.lastInteractionAtMs =
        now;

      this.finishIdle(
        now,
      );

      if (
        document.visibilityState ===
          "visible" &&
        document.hasFocus()
      ) {
        this.finishInterruption(
          now,
        );

        this.syncActiveClock(
          now,
        );
      }
    };

  private readonly handleOnline =
    () => {
      void this
        .refreshReadiness();

      void this.flush();
    };

  private readonly handlePageHide =
    () => {
      const now =
        Date.now();

      this.finishIdle(
        now,
      );

      this.finishInterruption(
        now,
      );

      this.finishRouteSession(
        now,
      );

      void this.flush();
    };

  private readonly handlePageShow =
    (
      event:
        PageTransitionEvent,
    ) => {
      this.lastInteractionAtMs =
        Date.now();

      if (
        event.persisted &&
        this.ready
      ) {
        this.startRouteSession(
          Date.now(),
        );
      }

      void this
        .refreshReadiness();
    };

  private readonly handleStorage =
    (
      event:
        StorageEvent,
    ) => {
      if (
        event.key ===
        DEVICE_STORAGE_KEY
      ) {
        void this
          .refreshReadiness();
      }
    };

  private readonly handleSettingsUpdated =
    () => {
      void this
        .refreshReadiness();
    };

  private async refreshReadiness() {
    if (
      this.readinessInFlight
    ) {
      return;
    }

    this.readinessInFlight =
      true;

    const externalDeviceId =
      safeRead(
        DEVICE_STORAGE_KEY,
      );

    this.externalDeviceId =
      externalDeviceId;

    try {
      const next =
        await loadCollectorReadiness(
          this.apiFetch,
          externalDeviceId,
        );

      this.readiness =
        next;

      if (
        !next.ready ||
        !next.privacy ||
        !next.device ||
        !next.connector
      ) {
        this.suspend(
          next.reason,
        );

        return;
      }

      const becameReady =
        !this.ready;

      this.ready =
        true;

      this.privacy =
        next.privacy;

      this.deviceId =
        next.device.id;

      this.connectorId =
        next.connector.id;

      if (becameReady) {
        const now =
          Date.now();

        this.lastInteractionAtMs =
          now;

        this.startRouteSession(
          now,
        );

        this.enqueue(
          this.createEvent({
            type:
              "DEVICE_ONLINE",

            source:
              "DEVICE",

            category:
              "SYSTEM",

            startedAtMs:
              now,

            foreground:
              true,

            metadata: {
              collector:
                "AIMERS_WEB_V1",

              reason:
                "COLLECTOR_READY",
            },
          }),
        );
      } else {
        this.syncActiveClock(
          Date.now(),
        );
      }

      this.emitStatus(
        "READY",
      );

      await Promise.all([
        this.flush(),
        this.heartbeat(),
      ]);
    } catch {
      this.emitStatus(
        "NETWORK_ERROR",
      );
    } finally {
      this.readinessInFlight =
        false;
    }
  }

  private suspend(
    reason:
      CollectorReadiness["reason"],
  ) {
    this.ready =
      false;

    this.privacy =
      null;

    this.deviceId =
      null;

    this.connectorId =
      null;

    this.activeSession =
      null;

    this.interruption =
      null;

    this.idleStartedAtMs =
      null;

    this.clearQueue();

    this.emitStatus(
      reason,
    );
  }

  private startRouteSession(
    now:
      number,
  ) {
    if (
      !this.ready ||
      !this.route ||
      this.activeSession
    ) {
      return;
    }

    this.activeSession = {
      sessionId:
        uuid(),

      route:
        this.route,

      startedAtMs:
        now,

      activeStartedAtMs:
        this.isActivelyEngaged()
          ? now
          : null,

      activeMs:
        0,

      interruptionCount:
        0,
    };

    this.enqueue(
      this.createEvent({
        type:
          "SESSION_STARTED",

        source:
          "STUDY_SESSION",

        category:
          routeCategory(
            this.route.pathname,
          ),

        startedAtMs:
          now,

        foreground:
          this.isActivelyEngaged(),

        externalReferenceId:
          this.route
            .pathname
            .slice(
              0,
              240,
            ),

        metadata:
          this.routeMetadata(
            this.route,
            {
              sessionId:
                this.activeSession
                  .sessionId,

              lifecycle:
                "STARTED",
            },
          ),
      }),
    );
  }

  private finishRouteSession(
    now:
      number,
  ) {
    const session =
      this.activeSession;

    if (
      !session ||
      !this.ready
    ) {
      this.activeSession =
        null;

      return;
    }

    this.syncActiveClock(
      now,
    );

    const wallDurationMs =
      Math.max(
        0,
        now -
          session.startedAtMs,
      );

    const activeDurationMs =
      Math.max(
        0,
        session.activeMs,
      );

    this.enqueue(
      this.createEvent({
        type:
          "SESSION_ENDED",

        source:
          "STUDY_SESSION",

        category:
          routeCategory(
            session
              .route
              .pathname,
          ),

        startedAtMs:
          session.startedAtMs,

        endedAtMs:
          now,

        durationSeconds:
          clampSeconds(
            activeDurationMs,
          ),

        foreground:
          activeDurationMs >
          0,

        externalReferenceId:
          session
            .route
            .pathname
            .slice(
              0,
              240,
            ),

        metadata:
          this.routeMetadata(
            session.route,
            {
              sessionId:
                session.sessionId,

              lifecycle:
                "ENDED",

              wallDurationSeconds:
                clampSeconds(
                  wallDurationMs,
                ),

              activeDurationSeconds:
                clampSeconds(
                  activeDurationMs,
                ),

              interruptionCount:
                session
                  .interruptionCount,
            },
          ),
      }),
    );

    this.activeSession =
      null;
  }

  private syncActiveClock(
    now:
      number,
  ) {
    const session =
      this.activeSession;

    if (!session) {
      return;
    }

    const active =
      this.isActivelyEngaged();

    if (
      session
        .activeStartedAtMs !==
        null &&
      !active
    ) {
      session.activeMs +=
        Math.max(
          0,
          now -
            session
              .activeStartedAtMs,
        );

      session.activeStartedAtMs =
        null;
    } else if (
      session
        .activeStartedAtMs ===
        null &&
      active
    ) {
      session.activeStartedAtMs =
        now;
    }
  }

  private isActivelyEngaged():
    boolean {
    return (
      this.ready &&
      this.idleStartedAtMs ===
        null &&
      document.visibilityState ===
        "visible" &&
      document.hasFocus()
    );
  }

  private startInterruption(
    now:
      number,
    reason:
      ActiveInterruption["reason"],
  ) {
    if (
      !this.ready ||
      !this.privacy
        ?.backgroundMonitoring ||
      this.idleStartedAtMs !==
        null ||
      this.interruption
    ) {
      return;
    }

    this.interruption = {
      startedAtMs:
        now,
      reason,
    };

    if (
      this.activeSession
    ) {
      this.activeSession
        .interruptionCount +=
        1;
    }
  }

  private finishInterruption(
    now:
      number,
  ) {
    const interruption =
      this.interruption;

    if (
      !interruption ||
      !this.ready
    ) {
      this.interruption =
        null;

      return;
    }

    this.interruption =
      null;

    const durationMs =
      Math.max(
        0,
        now -
          interruption
            .startedAtMs,
      );

    if (
      durationMs <
      1_000
    ) {
      return;
    }

    this.enqueue(
      this.createEvent({
        type:
          "FOCUS_INTERRUPTION",

        source:
          "DEVICE",

        category:
          "SYSTEM",

        startedAtMs:
          interruption
            .startedAtMs,

        endedAtMs:
          now,

        durationSeconds:
          clampSeconds(
            durationMs,
          ),

        foreground:
          false,

        metadata: {
          collector:
            "AIMERS_WEB_V1",

          reason:
            interruption
              .reason,

          route:
            this.route
              ?.pathname ??
            null,
        },
      }),
    );
  }

  private checkIdle() {
    if (
      !this.ready ||
      this.idleStartedAtMs !==
        null ||
      document.visibilityState !==
        "visible" ||
      !document.hasFocus()
    ) {
      return;
    }

    const now =
      Date.now();

    const idleAt =
      this.lastInteractionAtMs +
      IDLE_THRESHOLD_MS;

    if (
      now <
      idleAt
    ) {
      return;
    }

    const session =
      this.activeSession;

    if (
      session
        ?.activeStartedAtMs !==
        null &&
      session
        ?.activeStartedAtMs !==
        undefined
    ) {
      session.activeMs +=
        Math.max(
          0,
          idleAt -
            session
              .activeStartedAtMs,
        );

      session.activeStartedAtMs =
        null;
    }

    this.idleStartedAtMs =
      idleAt;
  }

  private finishIdle(
    now:
      number,
  ) {
    const idleStartedAtMs =
      this.idleStartedAtMs;

    if (
      idleStartedAtMs ===
        null
    ) {
      return;
    }

    this.idleStartedAtMs =
      null;

    if (this.ready) {
      const durationMs =
        Math.max(
          0,
          now -
            idleStartedAtMs,
        );

      this.enqueue(
        this.createEvent({
          type:
            "DEVICE_IDLE",

          source:
            "IDLE",

          category:
            "IDLE",

          startedAtMs:
            idleStartedAtMs,

          endedAtMs:
            now,

          durationSeconds:
            clampSeconds(
              durationMs,
            ),

          foreground:
            false,

          metadata: {
            collector:
              "AIMERS_WEB_V1",

            route:
              this.route
                ?.pathname ??
              null,
          },
        }),
      );

      this.enqueue(
        this.createEvent({
          type:
            "DEVICE_ACTIVE",

          source:
            "DEVICE",

          category:
            "SYSTEM",

          startedAtMs:
            now,

          foreground:
            true,

          metadata: {
            collector:
              "AIMERS_WEB_V1",

            reason:
              "USER_ACTIVITY_RESUMED",
          },
        }),
      );
    }

    this.lastInteractionAtMs =
      now;

    this.syncActiveClock(
      now,
    );
  }

  private createEvent({
    type,
    source,
    category,
    startedAtMs,
    endedAtMs,
    durationSeconds,
    foreground,
    externalReferenceId,
    metadata,
  }: {
    type:
      ActivityEventType;
    source:
      ActivitySource;
    category:
      ActivityCategory;
    startedAtMs:
      number;
    endedAtMs?:
      number;
    durationSeconds?:
      number;
    foreground:
      boolean;
    externalReferenceId?:
      string;
    metadata?:
      Record<
        string,
        unknown
      >;
  }): CollectorActivityEvent {
    if (
      !this.deviceId ||
      !this.connectorId
    ) {
      throw new Error(
        "Collector identity is unavailable.",
      );
    }

    return {
      eventKey:
        `aimers-web-${uuid()}`,

      connectedDeviceId:
        this.deviceId,

      dataConnectorId:
        this.connectorId,

      type,
      source,
      category,

      confidence:
        "OBSERVED",

      appName:
        "AIMERS OS",

      domain:
        window.location
          .hostname ||
        undefined,

      pageTitle:
        this.privacy
          ?.storeRawActivity
          ? document.title
              .slice(
                0,
                500,
              )
          : undefined,

      externalReferenceId,

      startedAt:
        new Date(
          startedAtMs,
        ).toISOString(),

      endedAt:
        endedAtMs ===
        undefined
          ? undefined
          : new Date(
              endedAtMs,
            ).toISOString(),

      durationSeconds,

      foreground,

      metadata:
        this.privacy
          ?.storeRawActivity
          ? metadata
          : undefined,
    };
  }

  private routeMetadata(
    route:
      CollectorRouteSnapshot,
    additional:
      Record<
        string,
        unknown
      >,
  ): Record<
    string,
    unknown
  > {
    return {
      collector:
        "AIMERS_WEB_V1",

      route:
        route.pathname,

      ...(this.privacy
        ?.storeFullUrls
        ? {
            search:
              route.search,

            hash:
              route.hash,
          }
        : {}),

      pageTitle:
        route
          .pageTitle
          .slice(
            0,
            500,
          ),

      ...additional,
    };
  }

  private enqueue(
    event:
      CollectorActivityEvent,
  ) {
    if (!this.ready) {
      return;
    }

    const queue =
      this.readQueue();

    queue.push(
      event,
    );

    const bounded =
      queue.slice(
        -MAX_QUEUE_SIZE,
      );

    this.writeQueue(
      bounded,
    );

    this.emitStatus(
      "READY",
    );
  }

  private async flush() {
    if (
      !this.ready ||
      this.flushInFlight ||
      !navigator.onLine
    ) {
      return;
    }

    const queue =
      this.readQueue();

    if (
      queue.length ===
      0
    ) {
      return;
    }

    const batch =
      queue.slice(
        0,
        MAX_BATCH_SIZE,
      );

    this.flushInFlight =
      true;

    try {
      await ingestCollectorEvents(
        this.apiFetch,
        batch,
      );

      const sentKeys =
        new Set(
          batch.map(
            (event) =>
              event.eventKey,
          ),
        );

      const latest =
        this.readQueue();

      this.writeQueue(
        latest.filter(
          (event) =>
            !sentKeys.has(
              event.eventKey,
            ),
        ),
      );

      this.lastSyncAt =
        new Date()
          .toISOString();

      window.dispatchEvent(
        new CustomEvent(
          ACTIVITY_INGESTED_EVENT,
          {
            detail: {
              count:
                batch.length,

              syncedAt:
                this.lastSyncAt,
            },
          },
        ),
      );

      this.emitStatus(
        "READY",
      );
    } catch (error) {
      const status =
        apiErrorStatus(
          error,
        );

      if (
        status === 403 ||
        status === 404
      ) {
        void this
          .refreshReadiness();
      }
    } finally {
      this.flushInFlight =
        false;
    }
  }

  private async heartbeat() {
    if (
      !this.ready ||
      !this.deviceId
    ) {
      return;
    }

    try {
      await sendCollectorHeartbeat(
        this.apiFetch,
        this.deviceId,
      );
    } catch {
      // Readiness polling will reconcile device state.
    }
  }

  private readQueue():
    CollectorActivityEvent[] {
    const raw =
      safeRead(
        this.queueKey(),
      );

    if (!raw) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(
          raw,
        );

      if (
        !Array.isArray(
          parsed,
        )
      ) {
        return [];
      }

      return parsed.filter(
        (
          candidate,
        ): candidate is
          CollectorActivityEvent =>
          typeof candidate ===
            "object" &&
          candidate !==
            null &&
          typeof candidate
            .eventKey ===
            "string",
      );
    } catch {
      return [];
    }
  }

  private writeQueue(
    queue:
      CollectorActivityEvent[],
  ) {
    if (
      queue.length ===
      0
    ) {
      safeRemove(
        this.queueKey(),
      );

      return;
    }

    safeWrite(
      this.queueKey(),
      JSON.stringify(
        queue,
      ),
    );
  }

  private clearQueue() {
    safeRemove(
      this.queueKey(),
    );
  }

  private queueKey():
    string {
    return (
      `${QUEUE_PREFIX}:`
      + (
        this.externalDeviceId ??
        "unregistered"
      )
    );
  }

  private routeKey(
    route:
      CollectorRouteSnapshot,
  ): string {
    return (
      route.pathname +
      route.search +
      route.hash
    );
  }

  private emitStatus(
    reason:
      CollectorStatusDetail["reason"],
  ) {
    const detail:
      CollectorStatusDetail = {
        ready:
          this.ready,
        reason,
        queueSize:
          this.readQueue()
            .length,
        lastSyncAt:
          this.lastSyncAt,
      };

    window.dispatchEvent(
      new CustomEvent(
        COLLECTOR_STATUS_EVENT,
        {
          detail,
        },
      ),
    );
  }
}
