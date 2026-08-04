import type {
  MockTestWeakTopic,
} from "../mock-tests/mock-tests.types";

export type PredictionConfidence =
  | "COLLECTING"
  | "LOW"
  | "MODERATE"
  | "HIGH";

export type SubjectRisk =
  | "HIGH"
  | "WATCH"
  | "STABLE";

export interface PredictionTrendPoint {
  attemptId: string;
  title: string;
  submittedAt: string | null;
  percentage: number;
  accuracyPercent: number;
  rawScore: number;
  totalMarks: number;
}

export interface PredictionSubjectSignal {
  key: string;
  name: string;
  scorePercent: number;
  accuracyPercent: number;
  attemptCount: number;
  movement: number | null;
  risk: SubjectRisk;
}

export interface PredictionBaselineRange {
  lower: number;
  centre: number;
  upper: number;
  uncertainty: number;
}

export interface PredictionEvidence {
  attemptCount: number;
  requiredAttempts: number;
  readinessPercent: number;
  latestScore: number | null;
  averageScore: number;
  bestScore: number;
  averageAccuracy: number;
  movement: number | null;
  scoreSpread: number | null;
  confidence: PredictionConfidence;
  predictionReady: boolean;
}

export interface PredictionWorkspace {
  evidence: PredictionEvidence;
  baselineRange: PredictionBaselineRange | null;
  trend: PredictionTrendPoint[];
  subjects: PredictionSubjectSignal[];
  weakTopics: MockTestWeakTopic[];
  integrity: {
    rankForecastAvailable: false;
    trainedModelAvailable: false;
    statement: string;
  };
}
