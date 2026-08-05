export type DevicePlatform =
  | "WEB"
  | "ANDROID"
  | "IOS"
  | "MACOS"
  | "WINDOWS"
  | "LINUX"
  | "IPADOS"
  | "OTHER";

export interface PrivacyPolicySection {
  title: string;
  paragraphs:
    readonly string[];
  bullets:
    readonly string[];
}

export interface PrivacyPolicy {
  version: string;
  title: string;
  summary: string;

  defaults: {
    rawRetentionDays:
      number;
    summaryRetentionDays:
      number;
    editable:
      boolean;
  };

  sections:
    readonly PrivacyPolicySection[];
}

export interface PrivacyAgreementWorkspace {
  required: boolean;
  accepted: boolean;
  acceptedAt:
    string | null;
  activationSource:
    string | null;
  policy:
    PrivacyPolicy;

  eligibility: {
    minor:
      boolean;
    guardianFlowRequired:
      boolean;
  };

  activation: {
    subscriptionEntitlementIntegration:
      string;
    developmentTrigger:
      string;
    allScopes:
      string[];
    nativeConnectors:
      string[];
    pendingExternalConnectors:
      string[];
  };
}

export interface AcceptPrivacyAgreementInput {
  policyVersion: string;
  externalDeviceId: string;
  deviceName: string;
  platform:
    DevicePlatform;
  appVersion?: string;
  osVersion?: string;
}

export interface AcceptPrivacyAgreementResponse {
  success: boolean;
  alreadyAccepted: boolean;
  workspace:
    PrivacyAgreementWorkspace;
}
