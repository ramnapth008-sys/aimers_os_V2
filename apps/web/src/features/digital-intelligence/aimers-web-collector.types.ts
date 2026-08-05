export type ApiFetch =
  <T>(
    path: string,
    init?: RequestInit,
  ) => Promise<T>;

export type ActivityEventType =
  | "SESSION_STARTED"
  | "SESSION_ENDED"
  | "DEVICE_IDLE"
  | "DEVICE_ACTIVE"
  | "DEVICE_OFFLINE"
  | "DEVICE_ONLINE"
  | "FOCUS_INTERRUPTION";

export type ActivitySource =
  | "STUDY_SESSION"
  | "DEVICE"
  | "IDLE";

export type ActivityCategory =
  | "STUDY"
  | "PRODUCTIVITY"
  | "COMMUNICATION"
  | "SYSTEM"
  | "IDLE"
  | "UNKNOWN";

export interface CollectorActivityEvent {
  eventKey: string;
  connectedDeviceId: string;
  dataConnectorId: string;
  type: ActivityEventType;
  source: ActivitySource;
  category: ActivityCategory;
  confidence: "OBSERVED";
  appName: string;
  domain?: string;
  pageTitle?: string;
  externalReferenceId?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  foreground: boolean;
  metadata?: Record<
    string,
    unknown
  >;
}

export interface CollectorPrivacy {
  monitoringEnabled: boolean;
  backgroundMonitoring: boolean;
  storeRawActivity: boolean;
  storeFullUrls: boolean;
  pausedAt: string | null;
}

export interface CollectorDevice {
  id: string;
  externalDeviceId: string;
  status:
    | "PENDING"
    | "ACTIVE"
    | "PAUSED"
    | "OFFLINE"
    | "REVOKED";
}

export interface CollectorConnector {
  id: string;
  connectedDeviceId: string | null;
  type: string;
  status:
    | "PENDING"
    | "ACTIVE"
    | "PAUSED"
    | "ERROR"
    | "REVOKED";
}

export interface CollectorReadiness {
  ready: boolean;
  reason:
    | "READY"
    | "AGREEMENT_REQUIRED"
    | "CONSENT_REQUIRED"
    | "MONITORING_DISABLED"
    | "MONITORING_PAUSED"
    | "BROWSER_NOT_REGISTERED"
    | "DEVICE_INACTIVE"
    | "CONNECTOR_NOT_FOUND"
    | "CONNECTOR_INACTIVE";
  privacy:
    CollectorPrivacy | null;
  device:
    CollectorDevice | null;
  connector:
    CollectorConnector | null;
}

export interface CollectorRouteSnapshot {
  pathname: string;
  search: string;
  hash: string;
  pageTitle: string;
}

export interface CollectorStatusDetail {
  ready: boolean;
  reason:
    CollectorReadiness["reason"] |
    "NETWORK_ERROR" |
    "STOPPED";
  queueSize: number;
  lastSyncAt: string | null;
}
