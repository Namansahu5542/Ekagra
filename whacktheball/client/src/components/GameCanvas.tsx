import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { ArrowRight, Check, Clock3, Crosshair, Minus, RotateCcw, Sparkles, Target, TimerReset, X } from "lucide-react";
import {
  COLOR_META,
  GAME_RULES,
  createGameScene,
  type BallColor,
  type GameHandle,
  type GameSnapshot,
} from "@/game/scene";

const EMPTY_SNAPSHOT: GameSnapshot = {
  status: "ready",
  targetColor: "yellow",
  score: 0,
  correct: 0,
  wrong: 0,
  missed: 0,
  bestStreak: 0,
  streak: 0,
  totalSpawned: 0,
  round: 0,
  timeLeft: GAME_RULES.duration,
  elapsedSeconds: 0,
  activeBalls: [],
  colorStats: {
    red: { correct: 0, attempts: 0 },
    blue: { correct: 0, attempts: 0 },
    green: { correct: 0, attempts: 0 },
    yellow: { correct: 0, attempts: 0 },
  },
};

const COLOR_NAMES: Record<BallColor, string> = {
  red: "red",
  blue: "blue",
  green: "green",
  yellow: "yellow",
};

function ColorDot({ color, large = false }: { color: BallColor; large?: boolean }) {
  return (
    <span
      className={large ? "color-dot color-dot--large" : "color-dot"}
      style={{
        background: `radial-gradient(circle at 32% 26%, #fff 0%, ${COLOR_META[color].hex} 21%, ${COLOR_META[color].glow} 100%)`,
        boxShadow: `0 0 0 3px rgba(255,255,255,.08), 0 4px 14px ${COLOR_META[color].glow}99`,
      }}
      aria-hidden="true"
    />
  );
}

function ScorePill({ value }: { value: number }) {
  return (
    <div className="score-pill" aria-label={`Score ${value}`}>
      <span className="score-pill__label">SCORE</span>
      <span className="score-pill__value">{value}</span>
    </div>
  );
}

function StatTile({ label, value, icon, tone }: { label: string; value: string | number; icon: ReactNode; tone?: string }) {
  return (
    <div className={`stat-tile ${tone ?? ""}`}>
      <div className="stat-tile__icon">{icon}</div>
      <div>
        <div className="stat-tile__value">{value}</div>
        <div className="stat-tile__label">{label}</div>
      </div>
    </div>
  );
}

function Results({ snapshot, onRestart }: { snapshot: GameSnapshot; onRestart: () => void }) {
  const attempts = snapshot.correct + snapshot.wrong;
  const accuracy = attempts ? Math.round((snapshot.correct / attempts) * 100) : 0;
  const grade = accuracy >= 90 ? "S" : accuracy >= 75 ? "A" : accuracy >= 60 ? "B" : "C";
  const totalHits = Math.max(1, Object.values(snapshot.colorStats).reduce((sum, stat) => sum + stat.attempts, 0));

  return (
    <main className="results-screen" aria-label="Game results">
      <div className="results-card">
        <div className="results-card__topline">
          <span className="eyebrow eyebrow--coral"><Sparkles size={14} /> RUN COMPLETE</span>
          <span className="results-card__round">45 sec arcade run</span>
        </div>
        <div className="results-card__hero">
          <div>
            <p className="results-card__kicker">YOUR FINAL SCORE</p>
            <h1 className="results-card__score">{snapshot.score}</h1>
            <p className="results-card__summary">
              {accuracy >= 75 ? "Sharp hands. The board never stood a chance." : "Good first run. Your rhythm is just getting warmed up."}
            </p>
          </div>
          <div className="grade-badge" aria-label={`Grade ${grade}`}>
            <span>GRADE</span>
            <strong>{grade}</strong>
          </div>
        </div>
        <div className="stats-grid">
          <StatTile label="Accuracy" value={`${accuracy}%`} icon={<Target size={17} />} tone="stat-tile--blue" />
          <StatTile label="Correct hits" value={snapshot.correct} icon={<Check size={18} />} tone="stat-tile--green" />
          <StatTile label="Wrong hits" value={snapshot.wrong} icon={<X size={17} />} tone="stat-tile--red" />
          <StatTile label="Best streak" value={snapshot.bestStreak} icon={<Sparkles size={17} />} tone="stat-tile--gold" />
        </div>
        <div className="breakdown">
          <div className="section-heading">
            <span>COLOR BREAKDOWN</span>
            <span>{attempts} total taps</span>
          </div>
          <div className="breakdown-list">
            {(Object.keys(COLOR_META) as BallColor[]).map((color) => {
              const stat = snapshot.colorStats[color];
              const percentage = Math.round((stat.attempts / totalHits) * 100);
              return (
                <div className="breakdown-row" key={color}>
                  <div className="breakdown-name"><ColorDot color={color} /><span>{COLOR_NAMES[color]}</span></div>
                  <div className="breakdown-meter"><span style={{ width: `${Math.max(percentage, stat.attempts ? 7 : 0)}%`, background: COLOR_META[color].hex }} /></div>
                  <span className="breakdown-count">{stat.correct}/{stat.attempts}</span>
                </div>
              );
            })}
          </div>
          <div className="score-legend">
            <span><b className="legend-plus">+{GAME_RULES.correctPoints}</b> correct color</span>
            <span><b className="legend-minus">{GAME_RULES.wrongPoints}</b> wrong color</span>
            <span><b className="legend-neutral">0</b> missed</span>
          </div>
        </div>
        <button className="primary-button" onClick={onRestart} type="button">
          <RotateCcw size={18} /> Play again <ArrowRight size={18} />
        </button>
      </div>
      <p className="results-footnote">Tap accuracy is based on attempted balls only. Missed balls do not change your score.</p>
    </main>
  );
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const handleRef = useRef<GameHandle | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });

    createGameScene(engine, canvas).then((handle) => {
      if (cancelled) {
        handle.dispose();
        return;
      }
      handleRef.current = handle;
      handle.subscribe(setSnapshot);
      engine.runRenderLoop(() => handle.scene.render());
      if (new URLSearchParams(window.location.search).has("demo")) {
        window.setTimeout(() => handle.start(), 450);
      }
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      handleRef.current?.dispose();
      handleRef.current = null;
      engine.dispose();
      startedRef.current = false;
    };
  }, []);

  const startGame = () => handleRef.current?.start();
  const isReady = snapshot.status === "ready";
  const isPlaying = snapshot.status === "playing";
  const previewColors: BallColor[] = ["red", "blue", "green", "yellow", "yellow", "green", "red", "blue"];
  const activeBySlot = new Map(snapshot.activeBalls.map((ball) => [ball.slot, ball.color]));

  return (
    <div className="game-root">
      <canvas ref={canvasRef} className="game-canvas" aria-label="Whack a Ball playfield" />
      <div className="game-grain" aria-hidden="true" />
      <div className={`game-board ${isPlaying ? "game-board--live" : ""}`} aria-label="Ball board">
        <div className="game-board__shine" aria-hidden="true" />
        <div className="game-board__slots">
          {Array.from({ length: 8 }, (_, slot) => {
            const ballColor = isReady ? previewColors[slot] : activeBySlot.get(slot);
            return (
              <button
                className={`ball-button ${ballColor ? "ball-button--active" : ""}`}
                key={slot}
                type="button"
                aria-label={ballColor ? `${COLOR_NAMES[ballColor]} ball` : "Empty ball hole"}
                disabled={!isPlaying || !ballColor}
                onClick={() => handleRef.current?.hitBall(slot)}
                style={ballColor ? { "--ball-color": COLOR_META[ballColor].hex, "--ball-glow": COLOR_META[ballColor].glow } as CSSProperties : undefined}
              >
                {ballColor && <span className="ball-button__shine" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
      <header className="game-header">
        <div className="brand-lockup">
          <div className="brand-mark"><Crosshair size={22} strokeWidth={2.4} /></div>
          <div>
            <div className="brand-name">WHACK A BALL</div>
            <div className="brand-tagline">quick hands · bright balls</div>
          </div>
        </div>
        {isPlaying && (
          <div className="live-pill"><span className="live-pill__dot" /> LIVE RUN</div>
        )}
      </header>

      {isPlaying && (
        <div className="play-hud">
          <ScorePill value={snapshot.score} />
          <div className="timer-pill">
            <Clock3 size={17} />
            <span>{String(snapshot.timeLeft).padStart(2, "0")}<small>s</small></span>
          </div>
        </div>
      )}

      {isReady && (
        <main className="start-screen">
          <div className="start-card">
            <div className="eyebrow"><span className="eyebrow__line" /> COLOR REACTION TRAINER</div>
            <h1>Hit the ball.<br /><em>Match the color.</em></h1>
            <p className="start-card__intro">A bright, bite-sized reflex challenge. Watch the target, scan the board, and tap fast.</p>
            <div className="target-preview">
              <div className="target-preview__ball"><ColorDot color="yellow" large /></div>
              <div>
                <div className="target-preview__label">YOUR TARGET</div>
                <div className="target-preview__value"><ColorDot color="yellow" /> yellow</div>
              </div>
            </div>
            <button className="primary-button" onClick={startGame} type="button">
              Start the run <ArrowRight size={18} />
            </button>
            <div className="start-card__hint"><TimerReset size={15} /> 45 seconds · best of your reflexes</div>
          </div>
          <div className="rules-card">
            <div className="section-heading"><span>HOW IT SCORES</span><span>simple rules</span></div>
            <div className="rule-row"><span className="rule-icon rule-icon--green"><Check size={15} /></span><span>Match the target color</span><strong className="rule-points rule-points--plus">+{GAME_RULES.correctPoints}</strong></div>
            <div className="rule-row"><span className="rule-icon rule-icon--red"><X size={15} /></span><span>Tap any other color</span><strong className="rule-points rule-points--minus">{GAME_RULES.wrongPoints}</strong></div>
            <div className="rule-row"><span className="rule-icon rule-icon--muted"><Minus size={15} /></span><span>Let a ball disappear</span><strong className="rule-points rule-points--muted">0</strong></div>
          </div>
        </main>
      )}

      {isPlaying && (
        <aside className="target-card" aria-live="polite">
          <div className="target-card__eyebrow">TAP THIS COLOR</div>
          <div className="target-card__color"><ColorDot color={snapshot.targetColor} large /><strong>{COLOR_NAMES[snapshot.targetColor]}</strong></div>
          <div className="target-card__micro">Round {String(snapshot.round).padStart(2, "0")} <span>·</span> {snapshot.streak > 1 ? `${snapshot.streak} on a streak` : "build a streak"}</div>
        </aside>
      )}

      {snapshot.status === "finished" && <Results snapshot={snapshot} onRestart={startGame} />}

      {isPlaying && (
        <div className="bottom-hint"><span>tap the matching ball</span><span className="bottom-hint__divider" /><span>wrong color = -1</span></div>
      )}
    </div>
  );
}
