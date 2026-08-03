import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  Check,
  ChevronDown,
  CircleCheckBig,
  Clock3,
  FlaskConical,
  GraduationCap,
  Layers3,
  Leaf,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAcademicWorkspace,
  updateAcademicChapterProgress,
  updateAcademicTopicMastery,
} from "./subjects.service";

import type {
  AcademicChapter,
  AcademicSyllabusSubject,
  AcademicUnit,
  AcademicWorkspace,
  ChapterProgress,
  TopicMastery,
} from "./subjects.types";

import "./subjects.css";

type SubjectTone =
  | "physics"
  | "chemistry"
  | "biology"
  | "default";

interface SubjectStatistics {
  chapters: number;
  topics: number;
  completedChapters: number;
  masteredTopics: number;
  progressPercent: number;
}

const masteryOptions = [
  {
    score: 0,
    label: "Not assessed",
  },
  {
    score: 40,
    label: "Developing",
  },
  {
    score: 60,
    label: "Proficient",
  },
  {
    score: 80,
    label: "Mastered",
  },
  {
    score: 100,
    label: "Perfect",
  },
];

function subjectTone(
  subjectCode: string,
): SubjectTone {
  const normalized =
    subjectCode.toUpperCase();

  if (normalized.includes("PHYS")) {
    return "physics";
  }

  if (normalized.includes("CHEM")) {
    return "chemistry";
  }

  if (
    normalized.includes("BIO") ||
    normalized.includes("BOT") ||
    normalized.includes("ZOO")
  ) {
    return "biology";
  }

  return "default";
}

function subjectIcon(
  tone: SubjectTone,
): ReactNode {
  if (tone === "physics") {
    return <Zap size={20} />;
  }

  if (tone === "chemistry") {
    return <FlaskConical size={20} />;
  }

  if (tone === "biology") {
    return <Leaf size={20} />;
  }

  return <BookOpenCheck size={20} />;
}

function masteryControlScore(
  mastery: TopicMastery | undefined,
): number {
  const score =
    mastery?.masteryScore ?? 0;

  if (score >= 100) {
    return 100;
  }

  if (score >= 80) {
    return 80;
  }

  if (score >= 60) {
    return 60;
  }

  if (score >= 40) {
    return 40;
  }

  return 0;
}

function formatMinutes(
  minutes: number | null,
): string {
  if (!minutes) {
    return "Flexible";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remaining =
    minutes % 60;

  return remaining
    ? `${hours}h ${remaining}m`
    : `${hours}h`;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not studied yet";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
}

function getSubjectChapters(
  subject: AcademicSyllabusSubject,
): AcademicChapter[] {
  return subject.units.flatMap(
    (unit) => unit.chapters,
  );
}

function buildStatistics(
  subject: AcademicSyllabusSubject,
  chapterProgress:
    readonly ChapterProgress[],
  topicMastery:
    readonly TopicMastery[],
): SubjectStatistics {
  const chapters =
    getSubjectChapters(subject);

  const topics =
    chapters.flatMap(
      (chapter) => chapter.topics,
    );

  const progressByChapter =
    new Map(
      chapterProgress.map(
        (progress) => [
          progress.chapterId,
          progress,
        ],
      ),
    );

  const masteryByTopic =
    new Map(
      topicMastery.map(
        (mastery) => [
          mastery.topicId,
          mastery,
        ],
      ),
    );

  const completedChapters =
    chapters.filter(
      (chapter) =>
        progressByChapter.get(
          chapter.id,
        )?.state === "COMPLETED",
    ).length;

  const masteredTopics =
    topics.filter(
      (topic) =>
        masteryByTopic.get(
          topic.id,
        )?.level === "MASTERED",
    ).length;

  const totalProgress =
    chapters.reduce(
      (sum, chapter) =>
        sum +
        (
          progressByChapter.get(
            chapter.id,
          )?.completionPercent ?? 0
        ),
      0,
    );

  return {
    chapters: chapters.length,
    topics: topics.length,
    completedChapters,
    masteredTopics,

    progressPercent:
      chapters.length === 0
        ? 0
        : Math.round(
            totalProgress /
            chapters.length,
          ),
  };
}

function replaceChapterProgress(
  workspace: AcademicWorkspace,
  next: ChapterProgress,
): AcademicWorkspace {
  const exists =
    workspace.chapterProgress.some(
      (item) =>
        item.chapterId ===
        next.chapterId,
    );

  return {
    ...workspace,

    chapterProgress: exists
      ? workspace.chapterProgress.map(
          (item) =>
            item.chapterId ===
            next.chapterId
              ? next
              : item,
        )
      : [
          ...workspace.chapterProgress,
          next,
        ],
  };
}

function replaceTopicMastery(
  workspace: AcademicWorkspace,
  next: TopicMastery,
): AcademicWorkspace {
  const exists =
    workspace.topicMastery.some(
      (item) =>
        item.topicId ===
        next.topicId,
    );

  return {
    ...workspace,

    topicMastery: exists
      ? workspace.topicMastery.map(
          (item) =>
            item.topicId ===
            next.topicId
              ? next
              : item,
        )
      : [
          ...workspace.topicMastery,
          next,
        ],
  };
}

function ProgressRing({
  value,
}: {
  value: number;
}) {
  const style = {
    "--subject-ring":
      `${value * 3.6}deg`,
  } as CSSProperties;

  return (
    <div
      className="subjects-progress-ring"
      style={style}
    >
      <div>
        <strong>{value}%</strong>
        <span>overall</span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="subjects-stat-card">
      <span>{icon}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function SubjectsLoading() {
  return (
    <section className="subjects-state-card">
      <LoaderCircle
        className="subjects-spinner"
        size={29}
      />

      <h1>
        Building your syllabus workspace
      </h1>

      <p>
        Loading subjects, chapters,
        topics and progress…
      </p>
    </section>
  );
}

function SubjectsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="subjects-state-card error">
      <AlertTriangle size={29} />

      <h1>
        Subjects could not be loaded
      </h1>

      <p>{message}</p>

      <button
        type="button"
        onClick={onRetry}
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </section>
  );
}

export function SubjectsPage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] = useState<AcademicWorkspace | null>(
    null,
  );

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] = useState("");

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    updatingChapterId,
    setUpdatingChapterId,
  ] = useState("");

  const [
    updatingTopicId,
    setUpdatingTopicId,
  ] = useState("");

  const loadWorkspace =
    useCallback(
      async (
        mode:
          | "initial"
          | "refresh" = "initial",
      ) => {
        if (mode === "initial") {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        try {
          const result =
            await getAcademicWorkspace(
              apiFetch,
            );

          setWorkspace(result);

          setSelectedSubjectId(
            (current) =>
              result
                .syllabusVersion
                .subjects.some(
                  (subject) =>
                    subject.id ===
                    current,
                )
                ? current
                : result
                    .syllabusVersion
                    .subjects[0]
                    ?.id ?? "",
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load the academic workspace.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [apiFetch],
    );

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const subjects =
    workspace
      ?.syllabusVersion
      .subjects ?? [];

  const selectedSubject =
    subjects.find(
      (subject) =>
        subject.id ===
        selectedSubjectId,
    ) ??
    subjects[0] ??
    null;

  const chapterProgressById =
    useMemo(
      () =>
        new Map(
          (
            workspace
              ?.chapterProgress ?? []
          ).map(
            (progress) => [
              progress.chapterId,
              progress,
            ],
          ),
        ),
      [workspace],
    );

  const topicMasteryById =
    useMemo(
      () =>
        new Map(
          (
            workspace
              ?.topicMastery ?? []
          ).map(
            (mastery) => [
              mastery.topicId,
              mastery,
            ],
          ),
        ),
      [workspace],
    );

  const allChapters =
    useMemo(
      () =>
        subjects.flatMap(
          getSubjectChapters,
        ),
      [subjects],
    );

  const allTopics =
    useMemo(
      () =>
        allChapters.flatMap(
          (chapter) =>
            chapter.topics,
        ),
      [allChapters],
    );

  const overallProgress =
    allChapters.length === 0
      ? 0
      : Math.round(
          allChapters.reduce(
            (sum, chapter) =>
              sum +
              (
                chapterProgressById
                  .get(chapter.id)
                  ?.completionPercent ??
                0
              ),
            0,
          ) /
          allChapters.length,
        );

  const completedChapters =
    allChapters.filter(
      (chapter) =>
        chapterProgressById.get(
          chapter.id,
        )?.state === "COMPLETED",
    ).length;

  const masteredTopics =
    allTopics.filter(
      (topic) =>
        topicMasteryById.get(
          topic.id,
        )?.level === "MASTERED",
    ).length;

  const filteredUnits =
    useMemo(() => {
      if (!selectedSubject) {
        return [];
      }

      const normalized =
        query.trim().toLowerCase();

      if (!normalized) {
        return selectedSubject.units;
      }

      return selectedSubject.units
        .map((unit) => {
          const unitMatches =
            unit.name
              .toLowerCase()
              .includes(normalized);

          const chapters =
            unit.chapters.filter(
              (chapter) =>
                unitMatches ||
                chapter.name
                  .toLowerCase()
                  .includes(normalized) ||
                chapter.topics.some(
                  (topic) =>
                    topic.name
                      .toLowerCase()
                      .includes(
                        normalized,
                      ),
                ),
            );

          return {
            ...unit,
            chapters,
          } satisfies AcademicUnit;
        })
        .filter(
          (unit) =>
            unit.chapters.length > 0,
        );
    }, [
      query,
      selectedSubject,
    ]);

  async function updateChapter(
    chapter: AcademicChapter,
    completionPercent: number,
  ) {
    if (!workspace) {
      return;
    }

    setUpdatingChapterId(
      chapter.id,
    );

    setError("");

    try {
      const result =
        await updateAcademicChapterProgress(
          apiFetch,
          chapter.id,
          {
            completionPercent,
          },
        );

      setWorkspace(
        (current) =>
          current
            ? replaceChapterProgress(
                current,
                result,
              )
            : current,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update chapter progress.",
      );
    } finally {
      setUpdatingChapterId("");
    }
  }

  async function updateTopic(
    topicId: string,
    masteryScore: number,
  ) {
    if (!workspace) {
      return;
    }

    setUpdatingTopicId(topicId);
    setError("");

    try {
      const current =
        topicMasteryById.get(
          topicId,
        );

      const result =
        await updateAcademicTopicMastery(
          apiFetch,
          topicId,
          {
            masteryScore,

            attempts:
              current?.attempts ?? 0,

            correctAnswers:
              current
                ?.correctAnswers ?? 0,

            confidenceScore:
              current
                ?.confidenceScore ??
              masteryScore,
          },
        );

      setWorkspace(
        (existing) =>
          existing
            ? replaceTopicMastery(
                existing,
                result,
              )
            : existing,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update topic mastery.",
      );
    } finally {
      setUpdatingTopicId("");
    }
  }

  if (loading) {
    return (
      <div className="subjects-page subjects-state-page">
        <SubjectsLoading />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="subjects-page subjects-state-page">
        <SubjectsError
          message={
            error ||
            "No academic workspace is available."
          }
          onRetry={() => {
            void loadWorkspace();
          }}
        />
      </div>
    );
  }

  const programme =
    workspace
      .syllabusVersion
      .programme;

  const selectedStatistics =
    selectedSubject
      ? buildStatistics(
          selectedSubject,
          workspace.chapterProgress,
          workspace.topicMastery,
        )
      : null;

  return (
    <div className="subjects-page">
      <header className="subjects-hero">
        <div className="subjects-hero-copy">
          <span className="subjects-eyebrow">
            <Sparkles size={14} />
            SYLLABUS INTELLIGENCE
          </span>

          <h1>
            Your academic
            <strong> command centre.</strong>
          </h1>

          <p>
            Move from syllabus to mastery with
            live chapter progress, topic-level
            confidence and a complete view of
            your {programme.name} journey.
          </p>

          <div className="subjects-programme-meta">
            <span>
              <GraduationCap size={15} />
              {programme.name}
            </span>

            <span>
              <Layers3 size={15} />
              {
                workspace
                  .syllabusVersion
                  .name
              }
            </span>

            <span>
              <CircleCheckBig size={15} />
              {workspace.status}
            </span>
          </div>
        </div>

        <div className="subjects-hero-progress">
          <ProgressRing
            value={overallProgress}
          />

          <div>
            <small>
              LEARNING VELOCITY
            </small>

            <strong>
              {completedChapters}
              <span>
                /{allChapters.length}
              </span>
            </strong>

            <p>
              chapters completed
            </p>
          </div>
        </div>
      </header>

      <section className="subjects-stat-grid">
        <StatCard
          icon={
            <BookOpenCheck
              size={19}
            />
          }
          label="SUBJECTS"
          value={`${subjects.length}`}
          detail="Active syllabus areas"
        />

        <StatCard
          icon={<Layers3 size={19} />}
          label="CHAPTERS"
          value={`${allChapters.length}`}
          detail={`${completedChapters} completed`}
        />

        <StatCard
          icon={<Brain size={19} />}
          label="TOPIC MASTERY"
          value={`${masteredTopics}`}
          detail={`of ${allTopics.length} mastered`}
        />

        <StatCard
          icon={<TrendingUp size={19} />}
          label="OVERALL PROGRESS"
          value={`${overallProgress}%`}
          detail="Across your syllabus"
        />
      </section>

      {error && (
        <div
          className="subjects-inline-error"
          role="alert"
        >
          <AlertTriangle size={16} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => {
              setError("");
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="subjects-card-grid">
        {subjects.map((subject) => {
          const tone =
            subjectTone(
              subject.subject.code,
            );

          const statistics =
            buildStatistics(
              subject,
              workspace.chapterProgress,
              workspace.topicMastery,
            );

          const selected =
            subject.id ===
            selectedSubject?.id;

          return (
            <button
              key={subject.id}
              className={
                selected
                  ? `subject-card ${tone} selected`
                  : `subject-card ${tone}`
              }
              type="button"
              onClick={() => {
                setSelectedSubjectId(
                  subject.id,
                );
                setQuery("");
              }}
            >
              <header>
                <span>
                  {subjectIcon(tone)}
                </span>

                <small>
                  {
                    subject
                      .subject
                      .code
                  }
                </small>

                {selected && (
                  <Check size={17} />
                )}
              </header>

              <h2>
                {subject.subject.name}
              </h2>

              <p>
                {statistics.chapters} chapters
                {" · "}
                {statistics.topics} topics
              </p>

              <div className="subject-card-progress">
                <span>
                  <i
                    style={{
                      width:
                        `${statistics.progressPercent}%`,
                    }}
                  />
                </span>

                <strong>
                  {
                    statistics
                      .progressPercent
                  }%
                </strong>
              </div>

              <footer>
                <span>
                  {
                    statistics
                      .completedChapters
                  } completed
                </span>

                <span>
                  {
                    statistics
                      .masteredTopics
                  } mastered
                </span>

                <ArrowRight size={15} />
              </footer>
            </button>
          );
        })}
      </section>

      {selectedSubject &&
        selectedStatistics && (
        <section className="subjects-workspace">
          <header className="subjects-workspace-header">
            <div>
              <span>
                {
                  selectedSubject
                    .subject
                    .code
                }
              </span>

              <h2>
                {
                  selectedSubject
                    .subject
                    .name
                } workspace
              </h2>

              <p>
                {
                  selectedStatistics
                    .chapters
                } chapters,
                {" "}
                {
                  selectedStatistics
                    .topics
                } topics and
                {" "}
                {
                  selectedStatistics
                    .progressPercent
                }% completion.
              </p>
            </div>

            <div className="subjects-workspace-actions">
              <label className="subjects-search">
                <Search size={16} />

                <input
                  value={query}
                  placeholder="Search chapters or topics"
                  onChange={(event) => {
                    setQuery(
                      event.target.value,
                    );
                  }}
                />
              </label>

              <button
                className="subjects-refresh-button"
                disabled={refreshing}
                type="button"
                onClick={() => {
                  void loadWorkspace(
                    "refresh",
                  );
                }}
              >
                <RefreshCw
                  className={
                    refreshing
                      ? "subjects-spinner"
                      : ""
                  }
                  size={16}
                />
                Refresh
              </button>
            </div>
          </header>

          <div className="subjects-selected-summary">
            <span>
              <BarChart3 size={17} />

              <strong>
                {
                  selectedStatistics
                    .progressPercent
                }%
              </strong>

              subject progress
            </span>

            <span>
              <CircleCheckBig
                size={17}
              />

              <strong>
                {
                  selectedStatistics
                    .completedChapters
                }
              </strong>

              completed chapters
            </span>

            <span>
              <Target size={17} />

              <strong>
                {
                  selectedStatistics
                    .masteredTopics
                }
              </strong>

              mastered topics
            </span>
          </div>

          {filteredUnits.length === 0 ? (
            <div className="subjects-no-results">
              <Search size={27} />

              <h3>
                No matching syllabus items
              </h3>

              <p>
                Try a chapter, unit or topic
                name.
              </p>
            </div>
          ) : (
            <div className="subjects-unit-list">
              {filteredUnits.map(
                (
                  unit,
                  unitIndex,
                ) => (
                  <details
                    key={unit.id}
                    className="subjects-unit"
                    open={
                      unitIndex === 0 ||
                      Boolean(query)
                    }
                  >
                    <summary>
                      <span className="unit-index">
                        {String(
                          unit.sequenceNumber,
                        ).padStart(2, "0")}
                      </span>

                      <div>
                        <small>UNIT</small>
                        <h3>{unit.name}</h3>
                        <p>
                          {
                            unit
                              .chapters
                              .length
                          } chapters
                        </p>
                      </div>

                      <ChevronDown
                        className="unit-chevron"
                        size={18}
                      />
                    </summary>

                    <div className="subjects-chapter-list">
                      {unit.chapters.map(
                        (chapter) => {
                          const progress =
                            chapterProgressById
                              .get(
                                chapter.id,
                              );

                          const percentage =
                            progress
                              ?.completionPercent ??
                            0;

                          const busy =
                            updatingChapterId ===
                            chapter.id;

                          return (
                            <article
                              key={
                                chapter.id
                              }
                              className={
                                progress?.state ===
                                "COMPLETED"
                                  ? "subjects-chapter completed"
                                  : "subjects-chapter"
                              }
                            >
                              <header className="chapter-heading">
                                <div className="chapter-number">
                                  {
                                    chapter
                                      .sequenceNumber
                                  }
                                </div>

                                <div className="chapter-title">
                                  <small>
                                    CHAPTER
                                  </small>

                                  <h4>
                                    {
                                      chapter
                                        .name
                                    }
                                  </h4>

                                  <p>
                                    {
                                      chapter
                                        .topics
                                        .length
                                    } topics
                                    {" · "}
                                    <Clock3
                                      size={13}
                                    />
                                    {
                                      formatMinutes(
                                        chapter
                                          .estimatedMinutes,
                                      )
                                    }
                                  </p>
                                </div>

                                <span
                                  className={
                                    `chapter-state ${
                                      (
                                        progress
                                          ?.state ??
                                        "NOT_STARTED"
                                      )
                                        .toLowerCase()
                                        .replace(
                                          "_",
                                          "-",
                                        )
                                    }`
                                  }
                                >
                                  {
                                    progress
                                      ?.state
                                      .replace(
                                        "_",
                                        " ",
                                      ) ??
                                    "NOT STARTED"
                                  }
                                </span>
                              </header>

                              <div className="chapter-progress-row">
                                <div className="chapter-progress-track">
                                  <span
                                    style={{
                                      width:
                                        `${percentage}%`,
                                    }}
                                  />
                                </div>

                                <strong>
                                  {percentage}%
                                </strong>
                              </div>

                              <div className="chapter-actions">
                                <button
                                  disabled={
                                    busy ||
                                    percentage >=
                                      100
                                  }
                                  type="button"
                                  onClick={() => {
                                    void updateChapter(
                                      chapter,
                                      Math.min(
                                        100,
                                        percentage +
                                          25,
                                      ),
                                    );
                                  }}
                                >
                                  {busy ? (
                                    <LoaderCircle
                                      className="subjects-spinner"
                                      size={15}
                                    />
                                  ) : (
                                    <TrendingUp
                                      size={15}
                                    />
                                  )}

                                  Advance 25%
                                </button>

                                <button
                                  className="complete-chapter-button"
                                  disabled={
                                    busy ||
                                    percentage >=
                                      100
                                  }
                                  type="button"
                                  onClick={() => {
                                    void updateChapter(
                                      chapter,
                                      100,
                                    );
                                  }}
                                >
                                  <CircleCheckBig
                                    size={15}
                                  />
                                  Mark complete
                                </button>

                                <span>
                                  Last activity:
                                  {" "}
                                  {
                                    formatDate(
                                      progress
                                        ?.lastStudiedAt ??
                                      null,
                                    )
                                  }
                                </span>
                              </div>

                              <div className="chapter-topic-list">
                                {chapter.topics.map(
                                  (topic) => {
                                    const mastery =
                                      topicMasteryById
                                        .get(
                                          topic.id,
                                        );

                                    const topicBusy =
                                      updatingTopicId ===
                                      topic.id;

                                    return (
                                      <div
                                        key={
                                          topic.id
                                        }
                                        className="chapter-topic"
                                      >
                                        <div>
                                          <span />

                                          <div>
                                            <strong>
                                              {
                                                topic
                                                  .name
                                              }
                                            </strong>

                                            <small>
                                              {
                                                formatMinutes(
                                                  topic
                                                    .estimatedMinutes,
                                                )
                                              }
                                            </small>
                                          </div>
                                        </div>

                                        <label>
                                          {topicBusy && (
                                            <LoaderCircle
                                              className="subjects-spinner"
                                              size={14}
                                            />
                                          )}

                                          <select
                                            aria-label={`Mastery for ${topic.name}`}
                                            disabled={
                                              topicBusy
                                            }
                                            value={
                                              masteryControlScore(
                                                mastery,
                                              )
                                            }
                                            onChange={(
                                              event,
                                            ) => {
                                              void updateTopic(
                                                topic.id,
                                                Number(
                                                  event
                                                    .target
                                                    .value,
                                                ),
                                              );
                                            }}
                                          >
                                            {
                                              masteryOptions.map(
                                                (
                                                  option,
                                                ) => (
                                                  <option
                                                    key={
                                                      option.score
                                                    }
                                                    value={
                                                      option.score
                                                    }
                                                  >
                                                    {
                                                      option.label
                                                    }
                                                  </option>
                                                ),
                                              )
                                            }
                                          </select>
                                        </label>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </article>
                          );
                        },
                      )}
                    </div>
                  </details>
                ),
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
