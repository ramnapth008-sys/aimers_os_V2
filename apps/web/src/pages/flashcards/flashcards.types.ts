export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type FlashcardLearningState =
  | "NEW"
  | "LEARNING"
  | "REVIEW"
  | "RELEARNING"
  | "MASTERED";

export type FlashcardReviewRating =
  | "AGAIN"
  | "HARD"
  | "GOOD"
  | "EASY";

export type FlashcardReviewSessionStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "ABANDONED";

export interface FlashcardSubject {
  id: string;
  code: string;
  name: string;
}

export interface FlashcardChapter {
  id: string;
  code: string;
  name: string;
}

export interface FlashcardTopic {
  id: string;
  code: string;
  name: string;
}

export interface FlashcardDeck {
  id: string;
  studentProfileId: string;
  name: string;
  description: string | null;
  color: string | null;
  status: "ACTIVE" | "ARCHIVED";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  subject: FlashcardSubject | null;
  chapter: FlashcardChapter | null;
  topic: FlashcardTopic | null;
  cardCount: number;
  dueCount: number;
}

export interface FlashcardSchedule {
  id: string;
  flashcardId: string;
  state: FlashcardLearningState;
  dueAt: string;
  intervalDays: number;
  scheduleStep: number;
  easeFactor: number;
  repetitions: number;
  lapseCount: number;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  sourceType:
    | "MANUAL"
    | "QUESTION_BANK"
    | "MOCK_TEST"
    | "PLATFORM";
  status:
    | "ACTIVE"
    | "SUSPENDED"
    | "ARCHIVED";
  front: string;
  back: string;
  hint: string | null;
  mnemonic: string | null;
  subject: FlashcardSubject;
  chapter: FlashcardChapter | null;
  topic: FlashcardTopic | null;
  sourceQuestion: {
    id: string;
    code: string;
  } | null;
  schedule: FlashcardSchedule | null;
}

export interface FlashcardReview {
  id: string;
  rating: FlashcardReviewRating;
  previousState: FlashcardLearningState;
  newState: FlashcardLearningState;
  previousIntervalDays: number;
  newIntervalDays: number;
  responseSeconds: number;
  reviewedAt: string;
}

export interface FlashcardReviewItem {
  id: string;
  sequenceNumber: number;
  reviewedAt: string | null;
  reviewed: boolean;
  review: FlashcardReview | null;
  flashcard: Flashcard;
}

export interface FlashcardReviewSession {
  id: string;
  studentProfileId: string;
  deckId: string | null;
  status: FlashcardReviewSessionStatus;
  totalCards: number;
  reviewedCards: number;
  remainingCards: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  durationSeconds: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentIndex: number;
  deck: FlashcardDeck | null;
  items: FlashcardReviewItem[];
}

export interface FlashcardRecentSession {
  id: string;
  studentProfileId: string;
  deckId: string | null;
  status: FlashcardReviewSessionStatus;
  totalCards: number;
  reviewedCards: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  durationSeconds: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deck: {
    id: string;
    name: string;
  } | null;
}

export interface FlashcardWorkspace {
  studentProfileId: string;
  syllabusVersionId: string;
  summary: {
    activeDeckCount: number;
    activeCardCount: number;
    dueNow: number;
    nextDueAt: string | null;
    totalReviews: number;
    strongRecallPercent: number;
    stateCounts: Record<
      FlashcardLearningState,
      number
    >;
    ratingCounts: Record<
      FlashcardReviewRating,
      number
    >;
  };
  decks: FlashcardDeck[];
  activeSession: FlashcardReviewSession | null;
  recentSessions: FlashcardRecentSession[];
}

export interface CreateFlashcardReviewSessionInput {
  deckId?: string;
  limit?: number;
}

export interface ReviewFlashcardInput {
  rating: FlashcardReviewRating;
  responseSeconds?: number;
}
