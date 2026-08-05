import type {
  ApiFetch,
  CollectorActivityEvent,
  CollectorConnector,
  CollectorDevice,
  CollectorPrivacy,
  CollectorReadiness,
} from "./aimers-web-collector.types";

interface PrivacyAgreementState {
  accepted: boolean;
}

interface ConsentGrant {
  scope: string;
  status: string;
  expiresAt: string | null;
}

interface ConsentWorkspace {
  grants: ConsentGrant[];
}

interface DeviceWorkspace {
  devices: CollectorDevice[];
}

interface ConnectorWorkspace {
  connectors:
    CollectorConnector[];
}

function isEffectiveGrant(
  grant:
    ConsentGrant,
): boolean {
  if (
    grant.scope !==
      "DIGITAL_ACTIVITY_MONITORING" ||
    grant.status !==
      "ACTIVE"
  ) {
    return false;
  }

  if (!grant.expiresAt) {
    return true;
  }

  return (
    new Date(
      grant.expiresAt,
    ).getTime() >
    Date.now()
  );
}

export async function loadCollectorReadiness(
  apiFetch:
    ApiFetch,
  externalDeviceId:
    string | null,
): Promise<CollectorReadiness> {
  const [
    agreement,
    consent,
    privacy,
    devices,
    connectors,
  ] = await Promise.all([
    apiFetch<
      PrivacyAgreementState
    >(
      "/privacy-agreement",
    ),

    apiFetch<
      ConsentWorkspace
    >(
      "/consent",
    ),

    apiFetch<
      CollectorPrivacy
    >(
      "/privacy",
    ),

    apiFetch<
      DeviceWorkspace
    >(
      "/devices",
    ),

    apiFetch<
      ConnectorWorkspace
    >(
      "/devices/connectors/all",
    ),
  ]);

  if (!agreement.accepted) {
    return {
      ready:
        false,
      reason:
        "AGREEMENT_REQUIRED",
      privacy,
      device:
        null,
      connector:
        null,
    };
  }

  if (
    !consent.grants.some(
      isEffectiveGrant,
    )
  ) {
    return {
      ready:
        false,
      reason:
        "CONSENT_REQUIRED",
      privacy,
      device:
        null,
      connector:
        null,
    };
  }

  if (
    !privacy.monitoringEnabled
  ) {
    return {
      ready:
        false,
      reason:
        "MONITORING_DISABLED",
      privacy,
      device:
        null,
      connector:
        null,
    };
  }

  if (privacy.pausedAt) {
    return {
      ready:
        false,
      reason:
        "MONITORING_PAUSED",
      privacy,
      device:
        null,
      connector:
        null,
    };
  }

  if (!externalDeviceId) {
    return {
      ready:
        false,
      reason:
        "BROWSER_NOT_REGISTERED",
      privacy,
      device:
        null,
      connector:
        null,
    };
  }

  const device =
    devices.devices.find(
      (candidate) =>
        candidate.externalDeviceId ===
        externalDeviceId,
    ) ??
    null;

  if (!device) {
    return {
      ready:
        false,
      reason:
        "BROWSER_NOT_REGISTERED",
      privacy,
      device:
        null,
      connector:
        null,
    };
  }

  if (
    device.status !==
      "ACTIVE" &&
    device.status !==
      "OFFLINE"
  ) {
    return {
      ready:
        false,
      reason:
        "DEVICE_INACTIVE",
      privacy,
      device,
      connector:
        null,
    };
  }

  const connector =
    connectors.connectors.find(
      (candidate) =>
        candidate.type ===
          "AIMERS_WEB" &&
        candidate.connectedDeviceId ===
          device.id,
    ) ??
    null;

  if (!connector) {
    return {
      ready:
        false,
      reason:
        "CONNECTOR_NOT_FOUND",
      privacy,
      device,
      connector:
        null,
    };
  }

  if (
    connector.status !==
    "ACTIVE"
  ) {
    return {
      ready:
        false,
      reason:
        "CONNECTOR_INACTIVE",
      privacy,
      device,
      connector,
    };
  }

  return {
    ready:
      true,
    reason:
      "READY",
    privacy,
    device,
    connector,
  };
}

export function ingestCollectorEvents(
  apiFetch:
    ApiFetch,
  events:
    CollectorActivityEvent[],
) {
  return apiFetch<{
    success: boolean;
    insertedCount?: number;
    receivedCount?: number;
  }>(
    "/activity/events/batch",
    {
      method:
        "POST",

      body:
        JSON.stringify({
          events,
        }),
    },
  );
}

export function sendCollectorHeartbeat(
  apiFetch:
    ApiFetch,
  deviceId:
    string,
) {
  return apiFetch<{
    success: boolean;
  }>(
    `/devices/${deviceId}/heartbeat`,
    {
      method:
        "POST",

      body:
        JSON.stringify({
          lastSyncAt:
            new Date()
              .toISOString(),

          appVersion:
            "AIMERS Web 2.0",

          osVersion:
            navigator
              .userAgent
              .slice(
                0,
                120,
              ),
        }),
    },
  );
}
