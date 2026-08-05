import type {
  ApiFetch,
  ConnectorWorkspace,
  ConsentScope,
  ConsentWorkspace,
  DataConnector,
  DataConnectorStatus,
  DeviceStatus,
  DeviceWorkspace,
  PrivacyPreference,
  RegisterConnectorInput,
  RegisterDeviceInput,
  SettingsWorkspace,
  UpdatePrivacyInput,
  ConnectedDevice,
} from "./settings.types";

const POLICY_VERSION =
  "aimers-digital-intelligence-v1";

export async function getSettingsWorkspace(
  apiFetch: ApiFetch,
): Promise<SettingsWorkspace> {
  const [
    consent,
    privacy,
    devices,
    connectors,
  ] = await Promise.all([
    apiFetch<ConsentWorkspace>(
      "/consent",
    ),

    apiFetch<PrivacyPreference>(
      "/privacy",
    ),

    apiFetch<DeviceWorkspace>(
      "/devices",
    ),

    apiFetch<ConnectorWorkspace>(
      "/devices/connectors/all",
    ),
  ]);

  return {
    consent,
    privacy,
    devices,
    connectors,
  };
}

export function grantConsent(
  apiFetch: ApiFetch,
  scope: ConsentScope,
) {
  return apiFetch<{
    success: boolean;
    grant: ConsentWorkspace["grants"][number];
  }>(
    `/consent/${scope}`,
    {
      method: "PUT",
      body: JSON.stringify({
        policyVersion:
          POLICY_VERSION,
      }),
    },
  );
}

export function revokeConsent(
  apiFetch: ApiFetch,
  scope: ConsentScope,
) {
  return apiFetch<{
    success: boolean;
    scope: ConsentScope;
    revokedCount: number;
    revokedAt: string;
  }>(
    `/consent/${scope}`,
    {
      method: "DELETE",
    },
  );
}

export function updatePrivacyPreferences(
  apiFetch: ApiFetch,
  input: UpdatePrivacyInput,
) {
  return apiFetch<PrivacyPreference>(
    "/privacy",
    {
      method: "PATCH",
      body: JSON.stringify(
        input,
      ),
    },
  );
}

export function registerDevice(
  apiFetch: ApiFetch,
  input: RegisterDeviceInput,
) {
  return apiFetch<{
    success: boolean;
    device: ConnectedDevice;
  }>(
    "/devices",
    {
      method: "POST",
      body: JSON.stringify(
        input,
      ),
    },
  );
}

export function updateDeviceStatus(
  apiFetch: ApiFetch,
  deviceId: string,
  status: DeviceStatus,
) {
  return apiFetch<{
    success: boolean;
    device: ConnectedDevice;
  }>(
    `/devices/${deviceId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    },
  );
}

export function registerConnector(
  apiFetch: ApiFetch,
  input: RegisterConnectorInput,
) {
  return apiFetch<{
    success: boolean;
    connector: DataConnector;
  }>(
    "/devices/connectors",
    {
      method: "POST",
      body: JSON.stringify(
        input,
      ),
    },
  );
}

export function updateConnectorStatus(
  apiFetch: ApiFetch,
  connectorId: string,
  status: DataConnectorStatus,
) {
  return apiFetch<{
    success: boolean;
    connector: DataConnector;
  }>(
    `/devices/connectors/${connectorId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    },
  );
}
