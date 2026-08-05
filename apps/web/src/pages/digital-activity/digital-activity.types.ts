export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type DataConfidence =
  | "MISSING"
  | "ESTIMATED"
  | "OBSERVED"
  | "VERIFIED"
  | "EXACT";

export interface ConnectedDevice {
  id: string;
  name: string;
  platform: string;
  status: string;
  lastSeenAt: string | null;
  lastSyncAt: string | null;
}

export interface DataConnector {
  id: string;
  type: string;
  displayName: string;
  status: string;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
}

export interface ActivityEvent {
  id: string;
  connectedDeviceId: string | null;
  dataConnectorId: string | null;
  type: string;
  source: string;
  category: string;
  confidence: DataConfidence;
  appName: string | null;
  domain: string | null;
  pageTitle: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  foreground: boolean;
  ingestedAt: string;
}

export interface LectureSession {
  id: string;
  connectedDeviceId: string | null;
  dataConnectorId: string | null;
  externalLectureId: string | null;
  platformName: string;
  courseTitle: string | null;
  lectureTitle: string;
  totalDurationSeconds: number | null;
  watchedSeconds: number;
  focusedSeconds: number;
  playbackPositionSeconds: number;
  completionPercent: number;
  completed: boolean;
  confidence: DataConfidence;
  startedAt: string;
  lastProgressAt: string | null;
  completedAt: string | null;
}

export interface ActivityOverview {
  monitoring: {
    enabled: boolean;
    background: boolean;
    pausedAt: string | null;
    connectedDevices: number;
    activeDevices: number;
    connectors: number;
    activeConnectors: number;
  };
  period: {
    days: number;
    from: string;
    to: string;
  };
  eventCount: number;
  recentEvents: ActivityEvent[];
  devices: ConnectedDevice[];
  connectors: DataConnector[];
  recentLectures: LectureSession[];
}

export interface ActivityAggregate {
  monitoredSeconds: number;
  studySeconds: number;
  productiveSeconds: number;
  distractionSeconds: number;
  idleSeconds: number;
  focusedStudySeconds: number;
  lectureSeconds: number;
  revisionSeconds: number;
  socialSeconds: number;
  entertainmentSeconds: number;
  contextSwitches: number;
  longestFocusSeconds: number;
  averageCoveragePercent: number;
  confidence: DataConfidence;
}

export interface IntelligenceDashboard {
  generatedAt: string;
  period: {
    days: number;
    from: string;
    to: string;
  };
  privacy: {
    monitoringEnabled: boolean;
    paused: boolean;
    behaviorAnalysisEnabled: boolean;
    aiContextEnabled: boolean;
    notificationEnabled: boolean;
    focusControlsEnabled: boolean;
  };
  connectivity: {
    devices: number;
    activeDevices: number;
    connectors: number;
    activeConnectors: number;
    devicesDetail: ConnectedDevice[];
    connectorsDetail: DataConnector[];
  };
  intelligence: {
    latestSnapshot: {
      focusScore: number | null;
      distractionRiskScore: number | null;
      overloadRiskScore: number | null;
      academicReadinessScore: number | null;
      coveragePercent: number;
      predictionConfidence: DataConfidence;
      generatedAt: string;
    } | null;
    activity: ActivityAggregate;
    activeSignalCount: number;
    openInterventionCount: number;
    incompleteLectureCount: number;
    pendingTaskCount: number;
  };
  activeSignals: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
  }>;
  openInterventions: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
  }>;
  incompleteLectures: LectureSession[];
}

export interface DigitalActivityWorkspace {
  overview: ActivityOverview;
  intelligence: IntelligenceDashboard;
}
