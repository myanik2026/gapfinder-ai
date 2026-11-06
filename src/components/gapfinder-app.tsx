"use client";

import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEMO_QUESTIONS, DEMO_SOURCES } from "@/lib/demo-data";
import type {
  QuizAttempt,
  QuizQuestion,
  StudyReply,
  StudySource,
  TopicResult,
} from "@/lib/types";

type View = "dashboard" | "materials" | "coach" | "progress" | "quiz" | "results";

const STORAGE_KEYS = {
  session: "gapfinder.demo-session",
  sources: "gapfinder.sources",
  attempts: "gapfinder.attempts",
  studyTime: "gapfinder.study-time",
};

const STORAGE_ERROR_EVENT = "gapfinder:storage-error";

function notifyStorageError(message: string, error: unknown): void {
  console.error(message, error);
  window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: message }));
}

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch (error) {
    notifyStorageError(
      "Saved study data could not be read. Check your browser storage settings.",
      error,
    );
    return fallback;
  }
}

function writeStoredValue(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    notifyStorageError(
      "Study data could not be saved in this browser. Check available storage.",
      error,
    );
  }
}

function removeStoredValue(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    notifyStorageError(
      "The demo session could not be cleared from this browser.",
      error,
    );
  }
}

function isSampleLibrary(sources: StudySource[]): boolean {
  return (
    sources.length === DEMO_SOURCES.length &&
    DEMO_SOURCES.every((sample) =>
      sources.some((source) => source.id === sample.id),
    )
  );
}

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `source-${Date.now()}`;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function getTopics(sources: StudySource[]): string[] {
  const found = new Set<string>();
  const ignored = /^(unit|chapter|module|exam|past paper|syllabus)\b/i;

  for (const source of sources) {
    for (const line of source.text.split(/\r?\n/)) {
      const clean = line.trim().replace(/^#+\s*/, "");
      if (
        clean.length >= 3 &&
        clean.length <= 48 &&
        /[a-z]/i.test(clean) &&
        !ignored.test(clean) &&
        (/^[A-Z][A-Z0-9 &-]+$/.test(clean) ||
          /^#{1,4}\s/.test(line.trim()) ||
          (source.name.toLowerCase().includes("syllabus") &&
            /^[A-Z][\w -]{2,40}$/.test(clean)))
      ) {
        found.add(titleCase(clean));
      }
    }
  }

  if (found.size) return [...found].slice(0, 12);
  return ["General review"];
}

function getTopicLevel(score: number): "weak" | "medium" | "strong" {
  if (score < 60) return "weak";
  if (score < 80) return "medium";
  return "strong";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function DemoLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="login-page">
      <div className="login-card">
        <div className="brand-mark brand-mark-large">
          <BrainCircuit size={25} strokeWidth={2.2} />
        </div>
        <span className="eyebrow">YOUR PERSONAL STUDY COACH</span>
        <h1>Find the gaps.<br />Make every study hour count.</h1>
        <p>
          Upload your course material, take a short diagnostic, and get a
          revision plan built around what you actually need to learn.
        </p>
        <div className="login-preview">
          <div className="login-preview-icon"><GraduationCap size={19} /></div>
          <div><strong>Demo student</strong><span>Your progress stays in this browser</span></div>
          <CheckCircle2 className="login-check" size={18} />
        </div>
        <button className="button button-primary login-button" onClick={onLogin}>
          Continue as demo student <ArrowRight size={17} />
        </button>
        <div className="login-trust"><LockKeyhole size={13} /> No password needed · No data leaves your browser unless you use AI</div>
      </div>
      <div className="login-orbit orbit-one" />
      <div className="login-orbit orbit-two" />
    </main>
  );
}

function GapFinderApp() {
  const [view, setView] = useState<View>("dashboard");
  const [loggedIn, setLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [sources, setSources] = useState<StudySource[]>(DEMO_SOURCES);
  const [isDemo, setIsDemo] = useState(true);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [studyDays, setStudyDays] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizTopic, setQuizTopic] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [lastResults, setLastResults] = useState<TopicResult[]>([]);
  const [loading, setLoading] = useState("");
  const [notice, setNotice] = useState("");
  const [coachQuestion, setCoachQuestion] = useState("");
  const [coachReply, setCoachReply] = useState<StudyReply | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleStorageError = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "string") {
        setNotice(event.detail);
      }
    };
    window.addEventListener(STORAGE_ERROR_EVENT, handleStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, handleStorageError);
  }, []);

  useEffect(() => {
    let active = true;
    const frame = window.requestAnimationFrame(() => {
      if (!active) return;
      setLoggedIn(readStoredValue(STORAGE_KEYS.session, false));
      const savedSources = readStoredValue<StudySource[] | null>(
        STORAGE_KEYS.sources,
        null,
      );
      const savedAttempts = readStoredValue<QuizAttempt[]>(STORAGE_KEYS.attempts, []);
      const savedTime = readStoredValue<{ days: number; hours: number } | null>(
        STORAGE_KEYS.studyTime,
        null,
      );
      if (savedSources?.length) {
        setSources(savedSources);
        setIsDemo(isSampleLibrary(savedSources));
      }
      setAttempts(savedAttempts);
      if (savedTime) {
        setStudyDays(savedTime.days);
        setHoursPerDay(savedTime.hours);
      }
      setHydrated(true);
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredValue(STORAGE_KEYS.sources, sources);
  }, [hydrated, sources]);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredValue(STORAGE_KEYS.attempts, attempts);
    writeStoredValue(
      STORAGE_KEYS.studyTime,
      { days: studyDays, hours: hoursPerDay },
    );
  }, [attempts, hoursPerDay, hydrated, studyDays]);

  const topics = useMemo(() => getTopics(sources), [sources]);
  const latestAttempt = attempts[0];
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.correct / attempt.total, 0) / attempts.length * 100)
    : 0;
  const weakTopics = latestAttempt
    ? latestAttempt.topicResults.filter((result) => getTopicLevel(result.score) === "weak").length
    : 0;

  function login() {
    writeStoredValue(STORAGE_KEYS.session, true);
    setLoggedIn(true);
  }

  function logout() {
    removeStoredValue(STORAGE_KEYS.session);
    setLoggedIn(false);
    setView("dashboard");
  }

  function latestScoreFor(topic: string): number | null {
    for (const attempt of attempts) {
      const result = attempt.topicResults.find(
        (item) => item.topic.toLowerCase() === topic.toLowerCase(),
      );
      if (result) return result.score;
    }
    return null;
  }

  function buildRevisionPlan() {
    const totalMinutes = Math.max(30, studyDays * hoursPerDay * 60);
    const plannedTopics = topics
      .map((topic) => {
        const score = latestScoreFor(topic) ?? 0;
        const examMentions = sources.some(
          (source) =>
            source.name.toLowerCase().includes("paper") &&
            source.text.toLowerCase().includes(topic.toLowerCase()),
        );
        const priority = (100 - (score ?? 50)) * 0.72 + (examMentions ? 28 : 0);
        return { topic, score, priority, examMentions };
      })
      .sort((left, right) => right.priority - left.priority);

    return plannedTopics.map((item, index) => {
        const minutes =
          Math.floor(totalMinutes / plannedTopics.length) +
          (index < totalMinutes % plannedTopics.length ? 1 : 0);
        return {
          ...item,
          minutes,
      };
    });
  }

  async function startQuiz(topic: string) {
    setLoading("Generating a diagnostic from your material…");
    setNotice("");
    setQuizTopic(topic);
    setSelectedAnswers({});
    setLastResults([]);

    try {
      const response = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "quiz", topic, sources }),
      });
      const result = (await response.json()) as
        | { questions: QuizQuestion[] }
        | { error: string };

      if (!response.ok) {
        if (response.status === 503 && isDemo) {
          const sampleQuestions = DEMO_QUESTIONS.filter(
            (question) => question.topic.toLowerCase() === topic.toLowerCase(),
          );
          setQuizQuestions(sampleQuestions.length ? sampleQuestions : DEMO_QUESTIONS);
          setNotice("Demo quiz loaded. Add GROQ_API_KEY to enable AI-generated questions.");
        } else {
          throw new Error("error" in result ? result.error : "Quiz generation failed.");
        }
      } else if ("questions" in result) {
        setQuizQuestions(result.questions);
        setNotice("Questions generated from your uploaded material.");
      }
      setView("quiz");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Quiz generation failed.");
    } finally {
      setLoading("");
    }
  }

  function submitQuiz() {
    const topicScores = new Map<string, { correct: number; total: number }>();
    let correct = 0;

    for (const question of quizQuestions) {
      const result = topicScores.get(question.topic) ?? { correct: 0, total: 0 };
      result.total += 1;
      if (selectedAnswers[question.id] === question.answerIndex) {
        result.correct += 1;
        correct += 1;
      }
      topicScores.set(question.topic, result);
    }

    const topicResults: TopicResult[] = [...topicScores.entries()].map(
      ([topic, result]) => ({
        topic,
        ...result,
        score: Math.round((result.correct / result.total) * 100),
      }),
    );
    const attempt: QuizAttempt = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      topic: quizTopic,
      correct,
      total: quizQuestions.length,
      topicResults,
    };
    setAttempts((current) => [attempt, ...current]);
    setLastResults(topicResults);
    setView("results");
    setNotice("");
  }

  async function askCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (coachQuestion.trim().length < 4) return;
    setLoading("Looking through your material…");
    setNotice("");
    setCoachReply(null);

    try {
      const response = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain",
          topic: topics[0] ?? "General review",
          question: coachQuestion.trim(),
          sources,
        }),
      });
      const result = (await response.json()) as StudyReply | { error: string };
      if (!response.ok) {
        throw new Error("error" in result ? result.error : "The assistant request failed.");
      }
      if ("answer" in result) setCoachReply(result);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The assistant request failed.");
    } finally {
      setLoading("");
    }
  }

  async function extractPdfText(file: File): Promise<string> {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    const document = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
    }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .filter(Boolean)
          .join(" "),
      );
    }
    return pages.join("\n\n");
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setNotice("");

    try {
      const remaining = Math.max(0, 8 - sources.filter((source) => !source.id.startsWith("demo-")).length);
      if (files.length > remaining) {
        throw new Error(`You can add up to ${remaining} more file(s).`);
      }

      const imported: StudySource[] = [];
      for (const file of files) {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (!isPdf && !/\.(txt|md|markdown)$/i.test(file.name)) {
          throw new Error(`${file.name}: upload a PDF, TXT, or Markdown file.`);
        }
        const text = isPdf ? await extractPdfText(file) : await file.text();
        const trimmed = text.trim();
        if (!trimmed) throw new Error(`${file.name} does not contain readable text.`);
        if (trimmed.length > 80_000) {
          throw new Error(`${file.name} is too large. Keep each file under 80,000 characters.`);
        }
        imported.push({ id: makeId(), name: file.name, text: trimmed });
      }

      const currentCharacters = sources
        .filter((source) => !source.id.startsWith("demo-"))
        .reduce((total, source) => total + source.text.length, 0);
      const addedCharacters = imported.reduce((total, source) => total + source.text.length, 0);
      if (currentCharacters + addedCharacters > 400_000) {
        throw new Error("Your uploaded material must stay under 400,000 characters in total.");
      }

      setSources((current) => [
        ...current.filter((source) => !source.id.startsWith("demo-")),
        ...imported,
      ]);
      setIsDemo(false);
      setNotice(`${imported.length} file${imported.length === 1 ? "" : "s"} added. Your uploaded text is saved in this browser.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "We couldn't read that file.");
    } finally {
      setUploading(false);
    }
  }

  function removeSource(id: string) {
    const remaining = sources.filter((source) => source.id !== id);
    setSources(remaining);
    setIsDemo(isSampleLibrary(remaining));
    setNotice("Material removed from this browser.");
  }

  function resetSampleMaterial() {
    setSources(DEMO_SOURCES);
    setIsDemo(true);
    setNotice("Sample Biology material restored.");
  }

  if (!hydrated) {
    return <main className="loading-screen"><LoaderCircle className="spin" size={24} /> Loading your study space…</main>;
  }

  if (!loggedIn) return <DemoLogin onLogin={login} />;

  const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "materials", label: "My materials", icon: BookOpen },
    { id: "coach", label: "Study coach", icon: MessageCircle },
    { id: "progress", label: "Progress", icon: Target },
  ];

  const plan = buildRevisionPlan();

  function renderCitation(source: string, excerpt: string) {
    return (
      <div className="citation">
        <FileText size={14} />
        <span><strong>{source}</strong><span className="citation-excerpt">“{excerpt}”</span></span>
      </div>
    );
  }

  function renderQuiz() {
    return (
      <section className="page-section">
        <button className="back-link" onClick={() => setView("dashboard")}>← Back to overview</button>
        <div className="page-heading quiz-heading">
          <div><span className="eyebrow">DIAGNOSTIC · {quizTopic.toUpperCase()}</span><h1>Let’s find your gaps.</h1><p>Choose the best answer. Every question is grounded in your study material.</p></div>
          <div className="quiz-progress-count"><span>{Object.keys(selectedAnswers).length}</span> / {quizQuestions.length} answered</div>
        </div>
        {notice && <div className="notice notice-info"><Sparkles size={16} />{notice}</div>}
        <div className="question-list">
          {quizQuestions.map((question, index) => (
            <article className="question-card" key={question.id}>
              <div className="question-meta"><span>QUESTION {String(index + 1).padStart(2, "0")}</span><span>{question.topic}</span></div>
              <h2>{question.question}</h2>
              <div className="option-list">
                {question.options.map((option, optionIndex) => (
                  <button
                    className={`option ${selectedAnswers[question.id] === optionIndex ? "option-selected" : ""}`}
                    key={`${question.id}-${optionIndex}`}
                    onClick={() => setSelectedAnswers((answers) => ({ ...answers, [question.id]: optionIndex }))}
                    aria-pressed={selectedAnswers[question.id] === optionIndex}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>{option}
                  </button>
                ))}
              </div>
              {renderCitation(question.citation.source, question.citation.excerpt)}
            </article>
          ))}
        </div>
        <div className="quiz-submit-row">
          <span>{quizQuestions.length - Object.keys(selectedAnswers).length} unanswered · You can still submit</span>
          <button className="button button-primary" onClick={submitQuiz}>Check my answers <ArrowRight size={16} /></button>
        </div>
      </section>
    );
  }

  function renderResults() {
    const total = lastResults.reduce((sum, result) => sum + result.total, 0);
    const correct = lastResults.reduce((sum, result) => sum + result.correct, 0);
    const percent = total ? Math.round((correct / total) * 100) : 0;
    return (
      <section className="page-section">
        <div className="results-topline"><span className="eyebrow">DIAGNOSTIC COMPLETE</span><button className="back-link" onClick={() => setView("dashboard")}>← Back to overview</button></div>
        <div className="results-hero">
          <div className="results-score"><strong>{percent}%</strong><span>overall score</span></div>
          <div><span className="eyebrow">YOUR LEARNING SNAPSHOT</span><h1>Now you know where to focus.</h1><p>You got {correct} of {total} questions right. Your revision plan has been updated based on this attempt.</p></div>
        </div>
        <div className="section-title-row"><div><span className="eyebrow">TOPIC-BY-TOPIC</span><h2>Your gap report</h2></div><span className="muted-caption">Based on your latest answers</span></div>
        <div className="gap-report-list">
          {lastResults.map((result) => {
            const level = getTopicLevel(result.score);
            return (
              <article className={`gap-report-card level-${level}`} key={result.topic}>
                <div className="gap-report-icon">{level === "weak" ? <ArrowDownRight size={18} /> : level === "medium" ? <CircleHelp size={18} /> : <Check size={18} />}</div>
                <div className="gap-report-main"><div className="gap-report-title"><strong>{result.topic}</strong><span className={`level-pill ${level}`}>{level}</span></div><p>You got {result.total - result.correct} of {result.total} question{result.total === 1 ? "" : "s"} wrong in this topic.</p></div>
                <div className="gap-report-score"><strong>{result.score}%</strong><div className="progress-track"><span style={{ width: `${result.score}%` }} /></div></div>
              </article>
            );
          })}
        </div>
        <div className="results-plan-callout"><div className="callout-icon"><Sparkles size={19} /></div><div><strong>Your plan just got smarter</strong><p>We moved your lowest-scoring, exam-relevant topics to the top of your revision plan.</p></div><button className="button button-light" onClick={() => setView("progress")}>View study plan <ArrowRight size={15} /></button></div>
        <div className="question-review">
          <div className="section-title-row"><div><span className="eyebrow">LEARN FROM EVERY ANSWER</span><h2>Answer review</h2></div></div>
          {quizQuestions.map((question, index) => {
            const selected = selectedAnswers[question.id];
            const isCorrect = selected === question.answerIndex;
            return (
              <article className="review-card" key={`review-${question.id}`}>
                <div className={`review-result-icon ${isCorrect ? "correct" : "incorrect"}`}>{isCorrect ? <Check size={16} /> : <X size={16} />}</div>
                <div className="review-card-content"><span className="eyebrow">QUESTION {index + 1} · {isCorrect ? "CORRECT" : "REVIEW THIS"}</span><h3>{question.question}</h3><p><strong>Answer:</strong> {question.options[question.answerIndex]}</p>{selected === undefined && <p><strong>Your answer:</strong> Not answered</p>}<p className="review-explanation">{question.explanation}</p>{renderCitation(question.citation.source, question.citation.excerpt)}</div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  function renderDashboard() {
    return (
      <section className="page-section">
        <div className="welcome-row">
          <div><span className="eyebrow">YOUR STUDY SPACE</span><h1>Good morning, Alex <span className="wave">✦</span></h1><p>Ready to make your next study session count?</p></div>
          <button className="button button-primary" onClick={() => startQuiz(topics[0] ?? "General review")} disabled={Boolean(loading)}><Sparkles size={16} /> Start a diagnostic <ArrowRight size={16} /></button>
        </div>
        {notice && <div className="notice notice-info"><Sparkles size={16} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15} /></button></div>}
        <div className="hero-card">
          <div className="hero-content"><span className="hero-kicker"><span className="hero-kicker-dot" /> YOUR NEXT BEST STEP</span><h2>Study what you<br />don’t know yet.</h2><p>A quick check-in helps us find the topics that need your attention—not the ones you’ve already mastered.</p><button className="button button-white" onClick={() => startQuiz(topics[0] ?? "General review")} disabled={Boolean(loading)}>Find my knowledge gaps <ArrowRight size={16} /></button></div>
          <div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-large" /><div className="art-orbit orbit-small" /><div className="art-center"><BrainCircuit size={42} /></div><div className="art-chip chip-one"><Check size={12} /> KNOWN</div><div className="art-chip chip-two"><span /> TO LEARN</div><div className="art-chip chip-three"><Sparkles size={12} /></div></div>
          <div className="hero-decoration">✳</div>
        </div>
        <div className="stat-grid">
          <article className="stat-card"><div className="stat-top"><span>STUDY MATERIALS</span><div className="stat-icon mint"><BookOpen size={17} /></div></div><strong>{sources.length}</strong><p>Sources in your library</p><button className="text-link" onClick={() => setView("materials")}>Manage materials <ArrowRight size={14} /></button></article>
          <article className="stat-card"><div className="stat-top"><span>DIAGNOSTICS TAKEN</span><div className="stat-icon peach"><Target size={17} /></div></div><strong>{attempts.length}</strong><p>{attempts.length ? "You're building a learning habit" : "Your first check-in is one click away"}</p><button className="text-link" onClick={() => startQuiz(topics[0] ?? "General review")}>Take a quick quiz <ArrowRight size={14} /></button></article>
          <article className="stat-card"><div className="stat-top"><span>AVERAGE ACCURACY</span><div className="stat-icon lavender"><Flame size={17} /></div></div><strong>{attempts.length ? `${averageScore}%` : "—"}</strong><p>{attempts.length ? "Across all your attempts" : "Complete a diagnostic to see your score"}</p><button className="text-link" onClick={() => setView("progress")}>View progress <ArrowRight size={14} /></button></article>
        </div>
        <div className="dashboard-columns">
          <div className="dashboard-main-column">
            <div className="section-title-row"><div><span className="eyebrow">YOUR COURSE</span><h2>Topic map <span className="count-badge">{topics.length}</span></h2></div><button className="text-link" onClick={() => setView("materials")}>View all <ArrowRight size={14} /></button></div>
            <div className="topic-list">
              {topics.slice(0, 5).map((topic, index) => {
                const score = latestScoreFor(topic);
                const level = score === null ? "untested" : getTopicLevel(score);
                return (
                  <article className="topic-row" key={topic}>
                    <div className={`topic-index topic-${index % 4}`}>{String(index + 1).padStart(2, "0")}</div>
                    <div className="topic-info"><strong>{topic}</strong><span>{score === null ? "Not assessed yet" : `${score}% accuracy · latest attempt`}</span></div>
                    {score === null ? <span className="level-pill untested">Not tested</span> : <span className={`level-pill ${level}`}>{level}</span>}
                    <button className="icon-button topic-action" onClick={() => startQuiz(topic)} aria-label={`Quiz yourself on ${topic}`}><ArrowRight size={16} /></button>
                  </article>
                );
              })}
            </div>
            <div className="section-title-row plan-title"><div><span className="eyebrow">A PLAN THAT ADAPTS TO YOU</span><h2>Your revision plan</h2></div><button className="text-link" onClick={() => setView("progress")}>See full plan <ArrowRight size={14} /></button></div>
            <div className="mini-plan-list">
              {plan.slice(0, 3).map((item, index) => (
                <article className="mini-plan-row" key={item.topic}><span className={`plan-number ${index === 0 ? "plan-number-active" : ""}`}>{index + 1}</span><div className="mini-plan-main"><strong>{item.topic}</strong><span>{item.examMentions ? "Frequently tested · " : ""}{item.score ? `${item.score}% mastery` : "Ready for your first check-in"}</span></div><span className="plan-duration"><Clock3 size={13} /> {item.minutes} min</span><button className="icon-button" onClick={() => startQuiz(item.topic)} aria-label={`Start a quiz for ${item.topic}`}><ArrowRight size={16} /></button></article>
              ))}
            </div>
          </div>
          <aside className="dashboard-side-column">
            <div className="side-card study-time-card"><div className="side-card-heading"><div><span className="eyebrow">MAKE IT REALISTIC</span><h3>Your study window</h3></div><Clock3 size={18} /></div><p>We’ll fit the plan to the time you have.</p><label className="field-label" htmlFor="study-days">Days until your exam</label><div className="number-field"><input id="study-days" type="number" min={1} max={60} value={studyDays} onChange={(event) => setStudyDays(Math.max(1, Math.min(60, Number(event.target.value) || 1)))} /><span>days</span><ChevronDown size={14} /></div><label className="field-label" htmlFor="study-hours">Study time per day</label><div className="number-field"><input id="study-hours" type="number" min={1} max={12} value={hoursPerDay} onChange={(event) => setHoursPerDay(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} /><span>hours</span><ChevronDown size={14} /></div><div className="total-study-time"><span>Total study time</span><strong>{studyDays * hoursPerDay} hours</strong></div></div>
            <div className="side-card insight-card"><div className="insight-icon"><Sparkles size={17} /></div><span className="eyebrow">A LITTLE INSIGHT</span><h3>{latestAttempt ? `${weakTopics} topic${weakTopics === 1 ? "" : "s"} need another look.` : "You can’t fix a gap you can’t see."}</h3><p>{latestAttempt ? "Your weakest topics are at the top of your plan. Re-test after a focused review to see the progress." : "Take a diagnostic to see which topics need your time, and which you can move on from."}</p><button className="text-link" onClick={() => latestAttempt ? setView("progress") : startQuiz(topics[0] ?? "General review")}>{latestAttempt ? "Review my plan" : "Find my gaps"} <ArrowRight size={14} /></button><div className="insight-spark">✳</div></div>
            <div className="privacy-note"><LockKeyhole size={14} /><span>Your notes are saved in this browser. They’re sent to Groq only when you request an AI quiz or explanation.</span></div>
          </aside>
        </div>
      </section>
    );
  }

  function renderMaterials() {
    return (
      <section className="page-section">
        <div className="page-heading"><div><span className="eyebrow">YOUR KNOWLEDGE BASE</span><h1>Study materials</h1><p>Bring your syllabus, notes, and past papers. Your coach will use them as its only source.</p></div><button className="button button-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Plus size={16} /> Add materials</button></div>
        {notice && <div className="notice notice-info"><Sparkles size={16} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15} /></button></div>}
        <input ref={fileInputRef} className="visually-hidden" type="file" accept=".pdf,.txt,.md,.markdown,text/plain,text/markdown,application/pdf" multiple onChange={handleUpload} />
        <button className="upload-zone" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <span className="upload-icon">{uploading ? <LoaderCircle className="spin" size={23} /> : <Upload size={23} />}</span>
          <strong>{uploading ? "Reading your material…" : "Drop in your study material"}</strong>
          <span>PDF, TXT, or Markdown · Up to 8 files · 80,000 characters per file</span>
          <span className="upload-browse">Choose files</span>
        </button>
        <div className="section-title-row materials-title"><div><span className="eyebrow">SOURCE LIBRARY</span><h2>Your uploaded files <span className="count-badge">{sources.length}</span></h2></div>{isDemo && <button className="text-link" onClick={resetSampleMaterial}><RotateCcw size={14} /> Restore sample</button>}</div>
        <div className="source-list">
          {sources.map((source) => (
            <article className="source-row" key={source.id}><div className="source-file-icon"><FileText size={18} /></div><div className="source-info"><strong>{source.name}</strong><span>{source.text.length.toLocaleString()} characters · {source.id.startsWith("demo-") ? "Sample source" : "Saved in this browser"}</span></div><span className="source-status"><span /> Ready</span><button className="icon-button delete-button" onClick={() => removeSource(source.id)} aria-label={`Remove ${source.name}`}><Trash2 size={16} /></button></article>
          ))}
        </div>
        <div className="section-title-row topic-map-title"><div><span className="eyebrow">EXTRACTED FROM YOUR MATERIAL</span><h2>Your topic map</h2></div><span className="muted-caption">{topics.length} topics found</span></div>
        <div className="topic-map-grid">
          {topics.map((topic, index) => (
            <button className="topic-map-card" key={topic} onClick={() => startQuiz(topic)}><span className={`topic-index topic-${index % 4}`}>{String(index + 1).padStart(2, "0")}</span><span><strong>{topic}</strong><small>{latestScoreFor(topic) === null ? "Not assessed" : `${latestScoreFor(topic)}% latest score`}</small></span><ArrowRight size={16} /></button>
          ))}
        </div>
      </section>
    );
  }

  function renderCoach() {
    return (
      <section className="page-section">
        <div className="page-heading"><div><span className="eyebrow">GROUNDED IN YOUR NOTES</span><h1>Ask your study coach</h1><p>Get a clear explanation backed by a passage from your own material.</p></div><div className="coach-spark"><BrainCircuit size={27} /></div></div>
        <div className="coach-layout">
          <div className="coach-chat-card">
            <div className="coach-chat-head"><div className="coach-avatar"><Sparkles size={18} /></div><div><strong>Your study coach</strong><span><span className="online-dot" /> Only answers from your material</span></div><span className="grounded-badge"><LockKeyhole size={12} /> GROUNDED</span></div>
            <div className="coach-chat-body">
              <div className="coach-message coach-assistant"><span className="message-label">YOUR STUDY COACH</span><p>Hi Alex! Ask me to explain a topic or clear up something from your notes. I’ll look for the answer in your uploaded material and show you the source.</p><span className="message-hint">Try: “What’s the difference between the Calvin cycle and light reactions?”</span></div>
              {coachReply && <div className="coach-message coach-assistant"><span className="message-label">GROUNDED ANSWER</span><p>{coachReply.answer}</p>{renderCitation(coachReply.citation.source, coachReply.citation.excerpt)}</div>}
              {loading && <div className="coach-loading"><LoaderCircle className="spin" size={16} />{loading}</div>}
            </div>
            {notice && <div className="notice notice-error coach-notice"><CircleHelp size={16} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15} /></button></div>}
            <form className="coach-form" onSubmit={askCoach}><textarea value={coachQuestion} onChange={(event) => setCoachQuestion(event.target.value)} placeholder="Ask a question about your materials…" rows={2} maxLength={600} /><button className="button button-primary" disabled={Boolean(loading) || coachQuestion.trim().length < 4} aria-label="Ask the study coach"><Send size={17} /></button></form>
            <span className="coach-disclaimer">Answers are based only on the sources listed below. No general internet knowledge.</span>
          </div>
          <aside className="coach-sources-card"><span className="eyebrow">AVAILABLE SOURCES</span><h3>What I can reference</h3><p>Your answers and generated questions are grounded in these files.</p>{sources.map((source) => <div className="coach-source" key={source.id}><FileText size={16} /><span>{source.name}</span><CheckCircle2 size={15} /></div>)}<button className="text-link" onClick={() => setView("materials")}>Manage sources <ArrowRight size={14} /></button></aside>
        </div>
      </section>
    );
  }

  function renderProgress() {
    const recent = attempts.slice(0, 6).reverse();
    return (
      <section className="page-section">
        <div className="page-heading"><div><span className="eyebrow">SMALL STEPS, REAL PROGRESS</span><h1>Your progress</h1><p>See how your understanding changes with each check-in.</p></div><button className="button button-primary" onClick={() => startQuiz(topics[0] ?? "General review")}><Sparkles size={16} /> Take a diagnostic</button></div>
        <div className="progress-summary-grid"><article className="progress-summary"><span className="eyebrow">OVERALL ACCURACY</span><strong>{attempts.length ? `${averageScore}%` : "—"}</strong><p>{attempts.length ? "Average across all diagnostic attempts" : "Complete a diagnostic to start tracking"}</p></article><article className="progress-summary"><span className="eyebrow">TOPICS TO REVIEW</span><strong>{latestAttempt ? weakTopics : "—"}</strong><p>Based on your latest diagnostic</p></article><article className="progress-summary"><span className="eyebrow">CHECK-INS COMPLETED</span><strong>{attempts.length}</strong><p>Your progress is saved in this browser</p></article></div>
        <div className="progress-content-grid">
          <div className="progress-chart-card"><div className="section-title-row"><div><span className="eyebrow">YOUR LEARNING CURVE</span><h2>Diagnostic history</h2></div><span className="muted-caption">Most recent first</span></div>{attempts.length ? <div className="chart-area"><div className="chart-y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-grid">{recent.map((attempt) => {const score = Math.round((attempt.correct / attempt.total) * 100); return <div className="chart-column" key={attempt.id}><div className="chart-bar-wrap"><div className="chart-bar" style={{ height: `${Math.max(7, score)}%` }} title={`${score}%`}><span>{score}%</span></div></div><span className="chart-date">{formatDate(attempt.createdAt)}</span></div>})}</div></div> : <div className="empty-chart"><div className="empty-chart-icon"><Target size={22} /></div><strong>Your progress starts with a check-in.</strong><p>Take a short diagnostic to set your baseline. After that, you’ll see how much you’ve improved.</p><button className="button button-primary" onClick={() => startQuiz(topics[0] ?? "General review")}>Take your first diagnostic <ArrowRight size={15} /></button></div>}</div>
          <div className="progress-plan-card"><div className="section-title-row"><div><span className="eyebrow">BASED ON YOUR GAPS</span><h2>Revision plan</h2></div></div><p className="plan-explainer">Your weakest and most frequently tested topics come first. The plan adjusts to your available time.</p><div className="plan-list">{plan.map((item, index) => {const level = item.score === null ? "untested" : getTopicLevel(item.score);return <article className="plan-item" key={item.topic}><div className={`plan-step ${index === 0 ? "plan-step-current" : ""}`}>{index + 1}</div><div className="plan-item-info"><strong>{item.topic}</strong><span>{item.examMentions ? "Exam-relevant" : "Study topic"} · {item.score === null ? "Not assessed" : `${item.score}% mastery`}</span><div className="progress-track"><span className={`progress-${level}`} style={{ width: `${item.score ?? 0}%` }} /></div></div><span className="plan-item-time"><Clock3 size={12} /> {item.minutes}m</span></article>})}</div><div className="plan-time-total"><span><Clock3 size={14} /> Your time budget</span><strong>{studyDays * hoursPerDay} hrs</strong></div><div className="plan-edit-time"><label htmlFor="plan-days">Exam in</label><input id="plan-days" type="number" min={1} max={60} value={studyDays} onChange={(event) => setStudyDays(Math.max(1, Math.min(60, Number(event.target.value) || 1)))} /><span>days ·</span><input aria-label="Study hours per day" type="number" min={1} max={12} value={hoursPerDay} onChange={(event) => setHoursPerDay(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} /><span>hrs/day</span></div></div>
        </div>
        {attempts.length > 0 && <div className="section-title-row history-title"><div><span className="eyebrow">YOUR RECENT WORK</span><h2>Recent diagnostics</h2></div></div>}
        {attempts.slice(0, 5).map((attempt) => <article className="history-row" key={attempt.id}><div className="history-date"><span>{formatDate(attempt.createdAt)}</span><small>{attempt.topic}</small></div><div className="history-topic-tags">{attempt.topicResults.map((result) => <span className={`level-pill ${getTopicLevel(result.score)}`} key={result.topic}>{result.topic}</span>)}</div><strong>{Math.round(attempt.correct / attempt.total * 100)}%</strong><span className="history-score-caption">{attempt.correct}/{attempt.total} correct</span></article>)}
      </section>
    );
  }

  const pageTitles: Record<View, string> = {
    dashboard: "Overview",
    materials: "My materials",
    coach: "Study coach",
    progress: "Progress",
    quiz: "Diagnostic quiz",
    results: "Gap report",
  };
  const showNav = view !== "quiz" && view !== "results";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setView("dashboard"); }}><span className="brand-mark"><BrainCircuit size={20} strokeWidth={2.2} /></span><span>gapfinder<span className="brand-period">.</span></span></a>
        <div className="sidebar-course"><div className="course-avatar"><GraduationCap size={17} /></div><div><span>YOUR STUDY SPACE</span><strong>Biology · Unit 4</strong></div><ChevronDown size={14} /></div>
        <span className="nav-label">WORKSPACE</span>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => {const Icon = item.icon;return <button className={`nav-item ${view === item.id ? "nav-item-active" : ""}`} key={item.id} onClick={() => {setView(item.id);setNotice("");}}><Icon size={17} /><span>{item.label}</span>{item.id === "materials" && <span className="nav-count">{sources.length}</span>}</button>})}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><div className="tip-icon"><Sparkles size={15} /></div><strong>A better way to study</strong><p>Find what you don’t know before exam day.</p><button onClick={() => startQuiz(topics[0] ?? "General review")}>Try a diagnostic <ArrowRight size={13} /></button></div>
          <div className="sidebar-profile"><div className="profile-avatar">A</div><div className="profile-info"><strong>Alex Morgan</strong><span>Demo student</span></div><button className="icon-button" onClick={logout} aria-label="Sign out"><LogOut size={15} /></button></div>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar"><div className="breadcrumb"><span>Study space</span><span>/</span><strong>{pageTitles[view]}</strong></div><div className="topbar-right"><span className="saved-indicator"><span /> Saved locally</span><span className="topbar-divider" /><button className="help-button" onClick={() => setView("coach")}><CircleHelp size={16} /> Help</button><div className="topbar-avatar">A</div></div></header>
        {loading && view !== "quiz" && <div className="global-loading"><LoaderCircle className="spin" size={15} />{loading}</div>}
        {view === "quiz" ? renderQuiz() : view === "results" ? renderResults() : showNav && view === "dashboard" ? renderDashboard() : view === "materials" ? renderMaterials() : view === "coach" ? renderCoach() : renderProgress()}
        <footer className="app-footer"><span>GAPFINDER <span className="footer-dot">·</span> STUDY SMARTER, NOT LONGER</span><span>Built for your learning journey <Sparkles size={12} /></span></footer>
      </main>
    </div>
  );
}

export default GapFinderApp;
