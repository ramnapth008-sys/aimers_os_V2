export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type ConsentScope =
  | "DIGITAL_ACTIVITY_MONITORING"
  | "APP_USAGE"
  | "BROWSER_ACTIVITY"
  | "BROWSER_HISTORY_IMPORT"
  | "LECTURE_PROGRESS"
  | "CROSS_DEVICE_SYNC"
  | "BEHAVIOR_ANALYSIS"
  | "AI_CONTEXT_SHARING"
  | "NOTIFICATIONS"
  | "FOCUS_CONTROLS";

export type ConsentStatus =
  | "PENDING"
  | "ACTIVE"
  | "REVOKED"
  | "EXPIRED";

export interface ConsentGrant {
  id: string;
  studentProfileId: string;
  scope: ConsentScope;
  status: ConsentStatus;
  actorType: "STUDENT" | "GUARDIAN" | "ADMIN";
  grantedByUserId: string | null;
  policyVersion: string;
  grantedForMinor: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentWorkspace {
  studentProfileId: string;
  grants: ConsentGrant[];
}

export interface PrivacyPreference {
  id: string;
  studentProfileId: string;
  monitoringEnabled: boolean;
  backgroundMonitoring: boolean;
  crossDeviceSync: boolean;
  storeRawActivity: boolean;
  storeFullUrls: boolean;
  importPastHistory: boolean;
  allowAiContext: boolean;
  allowBehaviorAnalysis: boolean;
  allowNotifications: boolean;
  allowFocusControls: boolean;
  localProcessingPreferred: boolean;
  minorModeEnabled: boolean;
  guardianApprovalRequired: boolean;
  rawRetentionDays: number;
  summaryRetentionDays: number;
  pausedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdatePrivacyInput =
  Partial<
    Pick<
      PrivacyPreference,
      | "monitoringEnabled"
      | "backgroundMonitoring"
      | "crossDeviceSync"
      | "storeRawActivity"
      | "storeFullUrls"
      | "importPastHistory"
      | "allowAiContext"
      | "allowBehaviorAnalysis"
      | "allowNotifications"
      | "allowFocusControls"
      | "localProcessingPreferred"
      | "rawRetentionDays"
      | "summaryRetentionDays"
    >
  >;

export type DevicePlatform =
  | "WEB"
  | "CHROME_EXTENSION"
  | "EDGE_EXTENSION"
  | "ANDROID"
  | "IOS"
  | "IPADOS"
  | "MACOS"
  | "WINDOWS"
  | "LINUX"
  | "OTHER";

export type DeviceStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "OFFLINE"
  | "REVOKED";

export type DataConnectorType =
  | "AIMERS_WEB"
  | "AIMERS_LECTURE_PLAYER"
  | "BROWSER_EXTENSION"
  | "ANDROID_USAGE_ACCESS"
  | "APPLE_DEVICE_ACTIVITY"
  | "DESKTOP_AGENT"
  | "YOUTUBE"
  | "LEARNING_PLATFORM"
  | "MANUAL_IMPORT";

export type DataConnectorStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "ERROR"
  | "REVOKED";

export interface DataConnector {
  id: string;
  studentProfileId: string;
  connectedDeviceId: string | null;
  type: DataConnectorType;
  status: DataConnectorStatus;
  displayName: string;
  externalAccountId: string | null;
  permissions: unknown;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  connectedDevice?: {
    id: string;
    name: string;
    platform: DevicePlatform;
    status: DeviceStatus;
    lastSeenAt: string | null;
  } | null;
}

export interface ConnectedDevice {
  id: string;
  studentProfileId: string;
  externalDeviceId: string;
  name: string;
  platform: DevicePlatform;
  status: DeviceStatus;
  appVersion: string | null;
  osVersion: string | null;
  lastSeenAt: string | null;
  lastSyncAt: string | null;
  monitoringStartedAt: string | null;
  monitoringPausedAt: string | null;
  createdAt: string;
  updatedAt: string;
  connectors: DataConnector[];
}

export interface DeviceWorkspace {
  studentProfileId: string;
  devices: ConnectedDevice[];
}

export interface ConnectorWorkspace {
  studentProfileId: string;
  connectors: DataConnector[];
}

export interface SettingsWorkspace {
  consent: ConsentWorkspace;
  privacy: PrivacyPreference;
  devices: DeviceWorkspace;
  connectors: ConnectorWorkspace;
}

export interface RegisterDeviceInput {
  externalDeviceId: string;
  name: string;
  platform: DevicePlatform;
  appVersion?: string;
  osVersion?: string;
}

export interface RegisterConnectorInput {
  connectedDeviceId?: string;
  type: DataConnectorType;
  displayName: string;
  externalAccountId?: string;
  permissions?: Record<string, unknown>;
}
