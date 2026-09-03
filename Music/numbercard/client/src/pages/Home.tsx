import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  Divide,
  Heart,
  History,
  Leaf,
  Lightbulb,
  ListOrdered,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  X as Times,
} from "lucide-react";
import GameCanvas from "../components/GameCanvas";
import {
  formatDuration,
  GameMode,
  GameSession,
  getStoredSummaries,
  MODE_LABELS,
  QuestionType,
  RoundSummary,
  storeSummary,
} from "../game/game";

const ROBIN_IMAGE = "/manus-storage/number-garden-robin_07fa33cf.png";
const REFERENCE_IMAGE = "/manus-storage/number-garden-reference_af2d4205.png";

type Screen = "home" | "play" | "summary";
type Feedback = { tone: "success" | "try"; title: string; body: string } | null;

const modes: Array<{ id: GameMode; name: string; detail: string; icon: typeof Plus; tone: string }> = [
  { id: "mixed", name: "Garden mix", detail: "A little of everything", icon: Sparkles, tone: "coral" },
  { id: "addition", name: "Add together", detail: "Join numbers", icon: Plus, tone: "yellow" },
  { id: "subtraction", name: "Take away", detail: "Find what remains", icon: Minus, tone: "blue" },
  { id: "multiplication", name: "Make groups", detail: "Grow in equal steps", icon: Times, tone: "lavender" },
  { id: "division", name: "Share equally", detail: "Split into groups", icon: Divide, tone: "mint" },
  { id: "sequence", name: "Number patterns", detail: "Spot what comes next", icon: ListOrdered, tone: "peach" },
];

function typeLabel(type: QuestionType) {
  return {
    addition: "Adding together",
    subtraction: "Taking away",
    multiplication: "Making groups",
    division: "Sharing equally",
    sequence: "Number patterns",
  }[type];
}

function formatHistoryDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [session, setSession] = useState<GameSession | null>(null);
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const [history, setHistory] = useState<RoundSummary[]>(() => getStoredSummaries());
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [, setUiTick] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const current = session?.current ?? null;
  const progress = session ? Math.round((session.currentIndex / session.totalQuestions) * 100) : 0;
  const isDemo = new URLSearchParams(window.location.search).has("demo");

  const clearPending = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  useEffect(() => clearPending, []);

  useEffect(() => {
    if (screen !== "play" || !session || session.isPaused) return;
    const interval = window.setInterval(() => setUiTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [screen, session]);

  useEffect(() => {
    if (!isDemo || screen !== "home") return;
    const timer = window.setTimeout(() => beginGame("mixed"), 450);
    return () => window.clearTimeout(timer);
  }, [isDemo, screen]);

  useEffect(() => {
    if (!isDemo || screen !== "play" || !session || !current || session.isPaused) return;
    const timer = window.setTimeout(() => handleAnswer(current.answer), 900);
    return () => window.clearTimeout(timer);
  }, [isDemo, screen, session, current, session?.currentIndex]);

  function beginGame(mode: GameMode) {
    clearPending();
    setSession(new GameSession(mode));
    setSummary(null);
    setFeedback(null);
    setHint(null);
    setScreen("play");
    setUiTick(Date.now());
  }

  function handleAnswer(answer: number) {
    if (!session || session.isPaused) return;
    const result = session.answer(answer);
    if (!result) return;
    setUiTick(Date.now());
    if (!result.wasCorrect) {
      setFeedback({ tone: "try", title: "Nearly there", body: "That one was close. Take another look and try again." });
      return;
    }

    setFeedback({ tone: "success", title: "Lovely work!", body: result.completed ? "You grew a beautiful little garden." : "That answer is blooming." });
    timeoutRef.current = window.setTimeout(() => {
      if (result.completed) {
        const nextSummary = session.summary();
        setSummary(nextSummary);
        setHistory(storeSummary(nextSummary));
        setScreen("summary");
      } else {
        setFeedback(null);
        setHint(null);
        setUiTick(Date.now());
      }
    }, 700);
  }

  function togglePause() {
    if (!session) return;
    if (session.isPaused) {
      session.resume();
      setFeedback(null);
    } else {
      session.pause();
    }
    setUiTick(Date.now());
  }

  function showHint() {
    if (!session || session.isPaused) return;
    setHint(session.useHint());
    setUiTick(Date.now());
  }

  function readPrompt() {
    if (!current || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(current.prompt.replace("?", "question mark"));
    utterance.rate = 0.82;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  function goHome() {
    clearPending();
    window.speechSynthesis?.cancel();
    setScreen("home");
    setSession(null);
    setFeedback(null);
    setHint(null);
  }

  const encouragement = useMemo(() => {
    if (!summary) return "You made time for yourself today.";
    if (summary.accuracy === 100) return "Every answer found its flower.";
    if (summary.accuracy >= 60) return "A thoughtful round with lots of bright spots.";
    return "You kept going — that is something to celebrate.";
  }, [summary]);

  return (
    <div className="app-shell">
      <GameCanvas />
      <div className="garden-wash" />
      <main className="app-content">
        {screen === "home" && (
          <HomeScreen history={history} onStart={beginGame} onOpenHistory={() => document.getElementById("history")?.scrollIntoView({ behavior: "smooth" })} />
        )}
        {screen === "play" && session && current && (
          <PlayScreen
            session={session}
            current={current}
            progress={progress}
            feedback={feedback}
            hint={hint}
            onAnswer={handleAnswer}
            onHint={showHint}
            onRead={readPrompt}
            onPause={togglePause}
            onExit={goHome}
          />
        )}
        {screen === "summary" && summary && (
          <SummaryScreen summary={summary} history={history} encouragement={encouragement} onAgain={() => beginGame(summary.mode)} onHome={goHome} />
        )}
      </main>
    </div>
  );
}

function Header({ onHistory }: { onHistory?: () => void }) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true"><Leaf size={22} strokeWidth={2.4} /></div>
        <div>
          <div className="brand-name">Number Garden</div>
          <div className="brand-subtitle">Calm play for every day</div>
        </div>
      </div>
      <div className="topbar-actions">
        <span className="calm-chip"><Heart size={14} fill="currentColor" /> No time limit</span>
        {onHistory && <button className="icon-button" onClick={onHistory} aria-label="View recent sessions" title="Recent sessions"><History size={19} /></button>}
      </div>
    </header>
  );
}

function HomeScreen({ history, onStart, onOpenHistory }: { history: RoundSummary[]; onStart: (mode: GameMode) => void; onOpenHistory: () => void }) {
  return (
    <div className="page home-page">
      <Header onHistory={onOpenHistory} />
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> A gentle brain garden</div>
          <h1>A little number <em>sunshine</em>.</h1>
          <p className="hero-lede">Small steps, happy moments, and plenty of time. Choose a path below and let Robin guide you through five friendly questions.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onStart("mixed")}><span>Start a garden mix</span><ArrowRight size={19} /></button>
            <span className="micro-note">5 questions · around 3 minutes</span>
          </div>
        </div>
        <div className="robin-intro">
          <div className="sun-orb" />
          <img src={ROBIN_IMAGE} alt="Robin, your friendly Number Garden guide" className="robin-image" />
          <div className="speech-bubble"><strong>Hello, friend!</strong><span>Ready when you are.</span></div>
          <div className="floating-petal petal-one" /><div className="floating-petal petal-two" />
        </div>
      </section>

      <section className="path-section" aria-labelledby="path-title">
        <div className="section-heading">
          <div><div className="eyebrow">Choose your pace</div><h2 id="path-title">Pick a garden path</h2></div>
          <span className="section-helper">You can change this anytime</span>
        </div>
        <div className="path-grid">
          {modes.map((mode) => <PathCard key={mode.id} mode={mode} onClick={() => onStart(mode.id)} />)}
        </div>
      </section>

      <section id="history" className="insights-strip">
        <div className="insight-intro"><div className="insight-icon"><BarChart3 size={21} /></div><div><div className="eyebrow">Your garden journal</div><h2>Recent sessions</h2></div></div>
        {history.length === 0 ? <div className="empty-history"><span>No sessions yet.</span> Your first round will appear here.</div> : <div className="history-list">{history.slice(0, 3).map((item, index) => <HistoryRow key={`${item.finishedAt}-${index}`} item={item} />)}</div>}
        <div className="privacy-note"><span className="dot" /> Saved on this device only</div>
      </section>

      <footer className="soft-footer"><span>Take your time</span><span className="footer-dot">·</span><span>One question at a time</span><span className="footer-dot">·</span><span>Celebrate every try</span></footer>
    </div>
  );
}

function PathCard({ mode, onClick }: { mode: (typeof modes)[number]; onClick: () => void }) {
  const Icon = mode.icon;
  return <button className={`path-card path-${mode.tone}`} onClick={onClick}><span className="path-icon"><Icon size={22} strokeWidth={2.5} /></span><span className="path-copy"><strong>{mode.name}</strong><small>{mode.detail}</small></span><ArrowRight className="path-arrow" size={18} /></button>;
}

function PlayScreen({ session, current, progress, feedback, hint, onAnswer, onHint, onRead, onPause, onExit }: { session: GameSession; current: NonNullable<GameSession["current"]>; progress: number; feedback: Feedback; hint: string | null; onAnswer: (answer: number) => void; onHint: () => void; onRead: () => void; onPause: () => void; onExit: () => void }) {
  return (
    <div className="page play-page">
      <header className="play-topbar">
        <button className="back-button" onClick={onExit}><ArrowLeft size={18} /> <span>Leave round</span></button>
        <div className="round-meta"><span className="round-label">{MODE_LABELS[session.mode]}</span><span className="round-count">Question {Math.min(session.currentIndex + 1, session.totalQuestions)} of {session.totalQuestions}</span></div>
        <div className="play-controls"><span className="timer-pill"><Clock3 size={16} /> {formatDuration(session.elapsedSeconds)}</span><button className="round-control" onClick={onPause}>{session.isPaused ? <><Play size={17} /> Continue</> : <><Pause size={17} /> Pause</>}</button></div>
      </header>
      <div className="progress-track" aria-label={`${progress}% complete`}><div className="progress-value" style={{ width: `${Math.max(5, progress)}%` }} /></div>
      <section className="question-stage">
        <div className="question-decor decor-left"><span /><span /><span /></div>
        <div className="question-card" aria-live="polite">
          <div className="question-card-top"><span className="question-type"><span className="type-dot" /> {typeLabel(current.type)}</span><button className="read-button" onClick={onRead}><Volume2 size={17} /> Read aloud</button></div>
          <div className="question-prompt">{current.prompt}</div>
          <div className="question-help">There is no hurry. Find the answer that feels right.</div>
          {feedback && <div className={`feedback ${feedback.tone}`}><span className="feedback-icon">{feedback.tone === "success" ? <Check size={17} /> : <Times size={17} />}</span><span><strong>{feedback.title}</strong>{feedback.body}</span></div>}
        </div>
        <div className="question-decor decor-right"><span /><span /><span /></div>
      </section>
      <section className="answers-section" aria-label="Answer choices">
        <div className="answer-heading"><span>Tap an answer</span><button className="hint-button" onClick={onHint} disabled={session.isPaused}><Lightbulb size={17} /> Give me a hint</button></div>
        {hint && <div className="hint-card"><Lightbulb size={17} /><span>{hint}</span></div>}
        <div className="answer-grid">{current.options.map((option, index) => <button key={option} className={`answer-button answer-${index + 1}`} onClick={() => onAnswer(option)} disabled={session.isPaused || feedback?.tone === "success"}><span className="answer-flower" aria-hidden="true"><span /><span /><span /><span /><span /><span /></span><span className="answer-value">{option}</span></button>)}</div>
      </section>
      {session.isPaused && <div className="pause-card"><div className="pause-orb"><Pause size={24} /></div><h2>Round paused</h2><p>Your place is saved. Come back when you feel ready.</p><button className="primary-button" onClick={onPause}><Play size={18} /> Continue gently</button><button className="text-button" onClick={onExit}>Return to paths</button></div>}
      <div className="play-footer"><span><Sparkles size={15} /> You are doing beautifully</span><span>Progress is personal</span></div>
    </div>
  );
}

function SummaryScreen({ summary, history, encouragement, onAgain, onHome }: { summary: RoundSummary; history: RoundSummary[]; encouragement: string; onAgain: () => void; onHome: () => void }) {
  return (
    <div className="page summary-page">
      <Header />
      <div className="summary-top"><button className="back-button" onClick={onHome}><ArrowLeft size={18} /> Back to paths</button><span className="summary-date">{formatHistoryDate(summary.finishedAt)}</span></div>
      <section className="summary-hero"><div className="summary-copy"><div className="eyebrow"><Trophy size={15} /> Round complete</div><h1>Wonderful garden work.</h1><p>{encouragement} Your calm focus is the important part.</p><button className="primary-button" onClick={onAgain}>Play this path again <RotateCcw size={18} /></button></div><div className="score-bloom"><div className="score-ring" style={{ "--score": `${summary.accuracy * 3.6}deg` } as React.CSSProperties}><div><strong>{summary.accuracy}%</strong><span>accuracy</span></div></div><div className="bloom-caption"><Sparkles size={15} /> Your round at a glance</div></div></section>
      <section className="stats-grid" aria-label="Session details"><StatCard icon={<Clock3 />} label="Time taken" value={formatDuration(summary.elapsedSeconds)} detail="active play time" /><StatCard icon={<Check />} label="Correct answers" value={`${summary.correctAnswers} / ${summary.totalQuestions}`} detail="questions solved" /><StatCard icon={<BarChart3 />} label="Average pace" value={`${summary.averageResponseSeconds}s`} detail="per correct answer" /><StatCard icon={<Lightbulb />} label="Hints used" value={`${summary.hintsUsed}`} detail="friendly reminders" /></section>
      <section className="details-panel"><div className="panel-heading"><div><div className="eyebrow">A closer look</div><h2>Question details</h2></div><span>{MODE_LABELS[summary.mode]}</span></div><div className="result-list">{summary.results.map((result, index) => <div className="result-row" key={result.id}><div className="result-number">{String(index + 1).padStart(2, "0")}</div><div className="result-prompt"><strong>{result.prompt}</strong><span>{result.hintUsed ? "Hint used" : "Solved independently"} · {result.attempts > 1 ? `${result.attempts} tries` : "First try"}</span></div><div className="result-time">{(result.responseMs / 1000).toFixed(1)}s</div><div className="result-check"><Check size={16} /></div></div>)}</div></section>
      <section className="mini-journal"><div className="insight-intro"><div className="insight-icon"><History size={20} /></div><div><div className="eyebrow">Keep noticing</div><h2>Recent journal</h2></div></div><div className="history-list">{history.slice(0, 3).map((item, index) => <HistoryRow key={`${item.finishedAt}-${index}`} item={item} />)}</div></section>
      <footer className="soft-footer"><span>Every answer is a seed</span><span className="footer-dot">·</span><span>Every try helps you grow</span></footer>
    </div>
  );
}

function StatCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><span className="stat-label">{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function HistoryRow({ item }: { item: RoundSummary }) {
  return <div className="history-row"><div className="history-date">{formatHistoryDate(item.finishedAt)}</div><div className="history-mode">{item.modeLabel}</div><div className="history-score"><strong>{item.accuracy}%</strong><span>accuracy</span></div><div className="history-time"><Clock3 size={14} /> {formatDuration(item.elapsedSeconds)}</div></div>;
}
