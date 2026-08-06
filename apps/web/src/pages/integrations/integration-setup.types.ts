export type ApiFetch =
  <T>(
    path: string,
    init?: RequestInit,
  ) => Promise<T>;

export type ConnectorSetupState =
  | "CONNECTED"
  | "PAUSED"
  | "AUTHORIZATION_REQUIRED"
  | "AWAITING_EXTERNAL_APPROVAL"
  | "AUTHORIZATION_FAILED"
  | "INTEGRATION_UNAVAILABLE"
  | "REVOKED";

export type ConnectorActionKind =
  | "MANAGE"
  | "CONSENT_REQUIRED"
  | "UNAVAILABLE"
  | "AWAITING_APPROVAL"
  | "RETRY"
  | "REVOKED"
  | "AUTHORIZE";

export interface ConnectorSetupAction {
  kind:
    ConnectorActionKind;
  label:
    string;
  enabled:
    boolean;
  reason:
    string | null;
  to:
    string | null;
}

export interface ConnectorSetupItem {
  connectorId:
    string;
  type:
    string;
  displayName:
    string;
  title:
    string;
  description:
    string;
  category:
    | "AIMERS_NATIVE"
    | "BROWSER"
    | "DEVICE"
    | "LEARNING_ACCOUNT"
    | "IMPORT";
  status:
    string;
  setupState:
    ConnectorSetupState;
  implementationAvailable:
    boolean;
  authorizationMode:
    string;
  unavailableReason:
    string | null;
  requiredScope:
    string;
  consentGranted:
    boolean;
  action:
    ConnectorSetupAction;
  externalAccountId:
    string | null;
  connectedDevice: {
    id: string;
    name: string;
    platform: string;
    status: string;
    lastSeenAt:
      string | null;
  } | null;
  lastSyncAt:
    string | null;
  lastSuccessfulSyncAt:
    string | null;
  errorMessage:
    string | null;
  createdAt:
    string;
  updatedAt:
    string;
}

export interface ConnectorSetupWorkspace {
  studentProfileId:
    string;
  summary: {
    total:
      number;
    connected:
      number;
    paused:
      number;
    unavailable:
      number;
    awaitingApproval:
      number;
    failed:
      number;
    readyToAuthorize:
      number;
    completionPercentage:
      number;
    setupComplete:
      boolean;
  };
  items:
    ConnectorSetupItem[];
}

export interface ConnectorSetupStartResult {
  success:
    boolean;
  connectorId:
    string;
  setupState:
    ConnectorSetupState;
  authorizationUrl:
    string | null;
  message:
    string | null;
}
