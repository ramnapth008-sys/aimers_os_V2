import {
  getMockTestWorkspace,
} from "../mock-tests/mock-tests.service";

import type {
  ApiFetch,
  MockTestWorkspace,
} from "../mock-tests/mock-tests.types";

import type {
  PredictionBaselineRange,
  PredictionConfidence,
  PredictionSubjectSignal,
  PredictionWorkspace,
  SubjectRisk,
} from "./prediction.types";

function clamp(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

function average(
  values: readonly number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    values.length
  );
}

function standardDeviation(
  values: readonly number[],
): number {
  if (values.length < 2) {
    return 0;
  }

  const mean =
    average(values);

  const variance =
    values.reduce(
      (
        total,
        value,
      ) =>
        total +
        (
          value - mean
        ) ** 2,
      0,
    ) /
    values.length;

  return Math.sqrt(
    variance,
  );
}

function weightedRecentAverage(
  values: readonly number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  let weightedTotal = 0;
  let totalWeight = 0;

  values.forEach(
    (
      value,
      index,
    ) => {
      const weight =
        index + 1;

      weightedTotal +=
        value * weight;

      totalWeight += weight;
    },
  );

  return (
    weightedTotal /
    totalWeight
  );
}

function confidenceLevel(
  attemptCount: number,
  spread: number,
): PredictionConfidence {
  if (attemptCount < 3) {
    return "COLLECTING";
  }

  if (
    attemptCount >= 6 &&
    spread <= 5
  ) {
    return "HIGH";
  }

  if (
    attemptCount >= 4 &&
    spread <= 9
  ) {
    return "MODERATE";
  }

  return "LOW";
}

function subjectRisk(
  scorePercent: number,
  accuracyPercent: number,
): SubjectRisk {
  if (
    scorePercent < 50 ||
    accuracyPercent < 55
  ) {
    return "HIGH";
  }

  if (
    scorePercent < 70 ||
    accuracyPercent < 70
  ) {
    return "WATCH";
  }

  return "STABLE";
}

function baselineRange(
  scores: readonly number[],
): PredictionBaselineRange | null {
  if (scores.length < 3) {
    return null;
  }

  const centre =
    weightedRecentAverage(
      scores,
    );

  const spread =
    standardDeviation(
      scores,
    );

  const samplePenalty =
    scores.length < 5
      ? 3
      : 1;

  const uncertainty =
    Math.max(
      4,
      Math.min(
        15,
        Math.round(
          spread * 1.25 +
          samplePenalty,
        ),
      ),
    );

  return {
    lower:
      clamp(
        centre -
        uncertainty,
      ),

    centre:
      clamp(centre),

    upper:
      clamp(
        centre +
        uncertainty,
      ),

    uncertainty,
  };
}

function subjectSignals(
  workspace: MockTestWorkspace,
): PredictionSubjectSignal[] {
  const subjectMap =
    new Map<
      string,
      {
        key: string;
        name: string;
        totalScore: number;
        totalMaxScore: number;
        correct: number;
        attempted: number;
        attempts: Map<
          string,
          {
            score: number;
            maxScore: number;
            correct: number;
            attempted: number;
            submittedAt: string | null;
          }
        >;
      }
    >();

  for (
    const attempt
    of workspace.attempts
  ) {
    for (
      const result
      of attempt.sectionResults
    ) {
      const subject =
        result.mockTestSection
          .subject;

      const key =
        subject?.id ??
        result.mockTestSection
          .name;

      const name =
        subject?.name ??
        result.mockTestSection
          .name;

      const current =
        subjectMap.get(key) ?? {
          key,
          name,
          totalScore: 0,
          totalMaxScore: 0,
          correct: 0,
          attempted: 0,
          attempts: new Map(),
        };

      current.totalScore +=
        result.score;

      current.totalMaxScore +=
        result.maxScore;

      current.correct +=
        result.correctAnswers;

      current.attempted +=
        result.attemptedQuestions;

      current.attempts.set(
        attempt.id,
        {
          score:
            result.score,

          maxScore:
            result.maxScore,

          correct:
            result.correctAnswers,

          attempted:
            result.attemptedQuestions,

          submittedAt:
            attempt.submittedAt,
        },
      );

      subjectMap.set(
        key,
        current,
      );
    }
  }

  return Array.from(
    subjectMap.values(),
  )
    .map((item) => {
      const scorePercent =
        item.totalMaxScore === 0
          ? 0
          : clamp(
              (
                item.totalScore /
                item.totalMaxScore
              ) *
              100,
            );

      const accuracyPercent =
        item.attempted === 0
          ? 0
          : clamp(
              (
                item.correct /
                item.attempted
              ) *
              100,
            );

      const orderedAttempts =
        Array.from(
          item.attempts.values(),
        ).sort(
          (
            left,
            right,
          ) =>
            new Date(
              left.submittedAt ??
              0,
            ).getTime() -
            new Date(
              right.submittedAt ??
              0,
            ).getTime(),
        );

      const percentages =
        orderedAttempts.map(
          (attempt) =>
            attempt.maxScore === 0
              ? 0
              : clamp(
                  (
                    attempt.score /
                    attempt.maxScore
                  ) *
                    100,
                ),
        );

      const movement =
        percentages.length < 2
          ? null
          : percentages[
              percentages.length -
              1
            ] -
            percentages[
              percentages.length -
              2
            ];

      return {
        key: item.key,
        name: item.name,
        scorePercent,
        accuracyPercent,
        attemptCount:
          item.attempts.size,
        movement,
        risk:
          subjectRisk(
            scorePercent,
            accuracyPercent,
          ),
      };
    })
    .sort(
      (
        left,
        right,
      ) =>
        left.scorePercent -
        right.scorePercent,
    );
}

export function buildPredictionWorkspace(
  workspace: MockTestWorkspace,
): PredictionWorkspace {
  const trend =
    workspace.trend.map(
      (item) => ({
        attemptId:
          item.attemptId,

        title:
          item.title,

        submittedAt:
          item.submittedAt,

        percentage:
          item.percentage,

        accuracyPercent:
          item.accuracyPercent,

        rawScore:
          item.rawScore,

        totalMarks:
          item.totalMarks,
      }),
    );

  const scores =
    trend.map(
      (item) =>
        item.percentage,
    );

  const latestScore =
    scores.length > 0
      ? scores[
          scores.length - 1
        ]
      : null;

  const previousScore =
    scores.length > 1
      ? scores[
          scores.length - 2
        ]
      : null;

  const spread =
    scores.length < 2
      ? null
      : Math.round(
          standardDeviation(
            scores,
          ),
        );

  const attemptCount =
    workspace.summary
      .attemptCount;

  const requiredAttempts = 3;

  return {
    evidence: {
      attemptCount,
      requiredAttempts,

      readinessPercent:
        Math.min(
          100,
          Math.round(
            (
              attemptCount /
              requiredAttempts
            ) *
              100,
          ),
        ),

      latestScore,

      averageScore:
        workspace.summary
          .averagePercentage,

      bestScore:
        workspace.summary
          .bestPercentage,

      averageAccuracy:
        workspace.summary
          .averageAccuracy,

      movement:
        latestScore !== null &&
        previousScore !== null
          ? latestScore -
            previousScore
          : null,

      scoreSpread:
        spread,

      confidence:
        confidenceLevel(
          attemptCount,
          spread ?? 0,
        ),

      predictionReady:
        workspace.summary
          .predictionReady,
    },

    baselineRange:
      baselineRange(scores),

    trend,

    subjects:
      subjectSignals(
        workspace,
      ),

    weakTopics:
      workspace.weakTopics,

    integrity: {
      rankForecastAvailable:
        false,

      trainedModelAvailable:
        false,

      statement:
        "This module reports observed assessment evidence and a conservative statistical baseline. It does not claim an exam rank or use a trained prediction model.",
    },
  };
}

export async function getPredictionWorkspace(
  apiFetch: ApiFetch,
): Promise<PredictionWorkspace> {
  const workspace =
    await getMockTestWorkspace(
      apiFetch,
    );

  return buildPredictionWorkspace(
    workspace,
  );
}
