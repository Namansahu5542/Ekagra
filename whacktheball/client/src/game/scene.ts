import { Engine } from "@babylonjs/core/Engines/engine";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { Scene } from "@babylonjs/core/scene";

export type BallColor = "red" | "blue" | "green" | "yellow";
export type GameStatus = "ready" | "playing" | "finished";

export type ColorStats = {
  correct: number;
  attempts: number;
};

export type BallView = {
  slot: number;
  color: BallColor;
};

export type GameSnapshot = {
  status: GameStatus;
  targetColor: BallColor;
  score: number;
  correct: number;
  wrong: number;
  missed: number;
  bestStreak: number;
  streak: number;
  totalSpawned: number;
  round: number;
  timeLeft: number;
  elapsedSeconds: number;
  activeBalls: BallView[];
  colorStats: Record<BallColor, ColorStats>;
};

export type GameHandle = {
  scene: Scene;
  start: () => void;
  hitBall: (slot: number) => void;
  subscribe: (listener: (snapshot: GameSnapshot) => void) => () => void;
  getSnapshot: () => GameSnapshot;
  dispose: () => void;
};

const GAME_DURATION = 45;
const SLOT_COUNT = 8;
const BALL_LIFETIME = 1450;
const COLORS: BallColor[] = ["red", "blue", "green", "yellow"];

const PALETTE: Record<BallColor, { hex: string; glow: string }> = {
  red: { hex: "#ff4f64", glow: "#ff183f" },
  blue: { hex: "#2f9cff", glow: "#006dff" },
  green: { hex: "#73da64", glow: "#32b74b" },
  yellow: { hex: "#ffd34e", glow: "#ff9d00" },
};

const cloneStats = (): Record<BallColor, ColorStats> => ({
  red: { correct: 0, attempts: 0 },
  blue: { correct: 0, attempts: 0 },
  green: { correct: 0, attempts: 0 },
  yellow: { correct: 0, attempts: 0 },
});

const randomColor = (previous?: BallColor): BallColor => {
  const choices = previous ? COLORS.filter((color) => color !== previous) : COLORS;
  return choices[Math.floor(Math.random() * choices.length)];
};

type ActiveBall = BallView & { spawnedAt: number; expiresAt: number };

type Layout = {
  viewWidth: number;
  viewHeight: number;
  boardWidth: number;
  boardHeight: number;
  boardY: number;
  holeX: number[];
  holeY: number[];
  ballSize: number;
};

function layoutFor(engine: Engine): Layout {
  const aspect = Math.max(engine.getRenderWidth() / Math.max(1, engine.getRenderHeight()), 0.38);
  const viewHeight = 10.8;
  const viewWidth = Math.max(5.8, Math.min(18.4, viewHeight * aspect));
  const boardWidth = Math.min(15.2, Math.max(5.05, viewWidth * 0.86));
  const boardHeight = boardWidth * 0.56;
  const boardY = -1.15;
  const xUnit = boardWidth * 0.24;
  const holeX = [-1.5, -0.5, 0.5, 1.5].map((x) => x * xUnit);
  const holeY = [boardY + boardHeight * 0.21, boardY - boardHeight * 0.21];
  return {
    viewWidth,
    viewHeight,
    boardWidth,
    boardHeight,
    boardY,
    holeX,
    holeY,
    ballSize: Math.max(0.43, boardWidth * 0.082),
  };
}

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.035, 0.028, 0.13, 1);

  const camera = new FreeCamera("game-camera", new Vector3(0, 0, -22), scene);
  camera.setTarget(Vector3.Zero());
  scene.activeCamera = camera;
  camera.mode = FreeCamera.ORTHOGRAPHIC_CAMERA;
  camera.minZ = 0.1;
  camera.maxZ = 100;

  const ambient = new HemisphericLight("ambient-light", new Vector3(0, 1, -1), scene);
  ambient.intensity = 0.86;
  ambient.diffuse = Color3.FromHexString("#c9ccff");
  ambient.groundColor = Color3.FromHexString("#16103d");
  const glowLight = new PointLight("warm-glow", new Vector3(0, 2, -8), scene);
  glowLight.diffuse = Color3.FromHexString("#ff7f57");
  glowLight.intensity = 16;
  glowLight.range = 20;

  const makeMaterial = (name: string, diffuse: string, emissive?: string) => {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = Color3.FromHexString(diffuse);
    material.specularColor = Color3.FromHexString("#ffffff");
    material.specularPower = 54;
    if (emissive) material.emissiveColor = Color3.FromHexString(emissive);
    return material;
  };

  const starMaterial = makeMaterial("star-material", "#8f87ff", "#5349e7");
  const stars: Mesh[] = [];
  const starCoordinates = [
    [-7.7, 3.9, 0.08],
    [-6.3, 2.5, 0.14],
    [-4.9, 4.25, 0.07],
    [4.9, 4.0, 0.1],
    [6.9, 2.85, 0.16],
    [7.7, 4.3, 0.08],
    [-8.2, -3.5, 0.12],
    [7.4, -3.7, 0.1],
  ];
  starCoordinates.forEach(([x, y, size], index) => {
    const star = MeshBuilder.CreateSphere(`star-${index}`, { diameter: size }, scene);
    star.position = new Vector3(x, y, 4);
    star.material = starMaterial;
    star.isPickable = false;
    stars.push(star);
  });

  const outerBoard = MeshBuilder.CreateBox("board-shadow", { width: 1, height: 1, depth: 0.5 }, scene);
  outerBoard.position.z = 0.55;
  outerBoard.material = makeMaterial("board-shadow-material", "#160d46", "#130b3d");
  outerBoard.isPickable = false;

  const board = MeshBuilder.CreateBox("play-board", { width: 1, height: 1, depth: 0.46 }, scene);
  board.position.z = 0.2;
  board.material = makeMaterial("board-material", "#f66c4c", "#9a2e36");
  board.isPickable = false;

  const boardTop = MeshBuilder.CreateBox("board-top", { width: 1, height: 1, depth: 0.12 }, scene);
  boardTop.position.z = -0.08;
  boardTop.material = makeMaterial("board-top-material", "#ff8661", "#9f3637");
  boardTop.isPickable = false;

  const rimMaterial = makeMaterial("hole-rim", "#ffbf54", "#c65d1c");
  const holeMaterial = makeMaterial("hole-inside", "#411229", "#150718");
  const holes: Mesh[] = [];
  const rims: Mesh[] = [];
  const ballMeshes: Mesh[] = [];
  const ballMaterials: Record<BallColor, StandardMaterial> = {
    red: makeMaterial("ball-red", PALETTE.red.hex, PALETTE.red.glow),
    blue: makeMaterial("ball-blue", PALETTE.blue.hex, PALETTE.blue.glow),
    green: makeMaterial("ball-green", PALETTE.green.hex, PALETTE.green.glow),
    yellow: makeMaterial("ball-yellow", PALETTE.yellow.hex, PALETTE.yellow.glow),
  };

  for (let slot = 0; slot < SLOT_COUNT; slot += 1) {
    const hole = MeshBuilder.CreateCylinder(`hole-${slot}`, { diameter: 1.58, height: 0.16, tessellation: 48 }, scene);
    hole.material = holeMaterial;
    hole.position.z = -0.34;
    hole.isPickable = false;
    holes.push(hole);

    const rim = MeshBuilder.CreateTorus(`rim-${slot}`, { diameter: 1.62, thickness: 0.16, tessellation: 48 }, scene);
    rim.material = rimMaterial;
    rim.position.z = -0.52;
    rim.rotation.x = Math.PI / 2;
    rim.isPickable = false;
    rims.push(rim);

    const ball = MeshBuilder.CreateSphere(`ball-${slot}`, { diameter: 1, segments: 32 }, scene);
    ball.material = ballMaterials[COLORS[slot % COLORS.length]];
    ball.position.z = -0.92;
    ball.metadata = { slot };
    ball.isPickable = true;
    ballMeshes.push(ball);
  }

  const layoutScene = () => {
    const layout = layoutFor(engine);
    camera.orthoLeft = -layout.viewWidth / 2;
    camera.orthoRight = layout.viewWidth / 2;
    camera.orthoTop = layout.viewHeight / 2;
    camera.orthoBottom = -layout.viewHeight / 2;
    outerBoard.scaling = new Vector3(layout.boardWidth * 1.035, layout.boardHeight * 1.055, 1);
    outerBoard.position.y = layout.boardY - 0.12;
    board.scaling = new Vector3(layout.boardWidth, layout.boardHeight, 1);
    board.position.y = layout.boardY;
    boardTop.scaling = new Vector3(layout.boardWidth * 0.972, layout.boardHeight * 0.9, 1);
    boardTop.position.y = layout.boardY + 0.02;
    holes.forEach((hole, slot) => {
      const column = slot % 4;
      const row = Math.floor(slot / 4);
      hole.position.x = layout.holeX[column];
      hole.position.y = layout.holeY[row];
      hole.scaling = new Vector3(layout.ballSize * 1.34, layout.ballSize * 0.72, layout.ballSize * 1.34);
    });
    rims.forEach((rim, slot) => {
      const column = slot % 4;
      const row = Math.floor(slot / 4);
      rim.position.x = layout.holeX[column];
      rim.position.y = layout.holeY[row];
      rim.scaling = new Vector3(layout.ballSize * 1.34, layout.ballSize * 1.34, layout.ballSize * 1.34);
    });
    ballMeshes.forEach((ball, slot) => {
      const column = slot % 4;
      const row = Math.floor(slot / 4);
      ball.position.x = layout.holeX[column];
      ball.position.y = layout.holeY[row];
      ball.scaling.x = layout.ballSize;
      ball.scaling.z = layout.ballSize;
      ball.scaling.y = layout.ballSize;
    });
  };
  layoutScene();

  const active: Array<ActiveBall | null> = Array.from({ length: SLOT_COUNT }, () => null);
  const listeners = new Set<(snapshot: GameSnapshot) => void>();
  let targetColor: BallColor = "yellow";
  let status: GameStatus = "ready";
  let score = 0;
  let correct = 0;
  let wrong = 0;
  let missed = 0;
  let bestStreak = 0;
  let streak = 0;
  let totalSpawned = 0;
  let startedAt = 0;
  let endsAt = 0;
  let lastSpawnAt = 0;
  let lastPublishedAt = 0;
  let round = 0;
  let colorStats = cloneStats();

  const setBallVisible = (slot: number, visible: boolean, color?: BallColor) => {
    const mesh = ballMeshes[slot];
    if (color) mesh.material = ballMaterials[color];
    mesh.isVisible = visible;
    if (!visible) mesh.scaling.y = layoutFor(engine).ballSize;
  };

  const resetBalls = () => {
    active.forEach((ball, slot) => {
      active[slot] = null;
      setBallVisible(slot, false);
    });
  };

  const snapshot = (): GameSnapshot => {
    const now = performance.now();
    const elapsedSeconds = status === "ready" ? 0 : Math.min(GAME_DURATION, Math.max(0, (now - startedAt) / 1000));
    const timeLeft = status === "playing" ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : status === "finished" ? 0 : GAME_DURATION;
    return {
      status,
      targetColor,
      score,
      correct,
      wrong,
      missed,
      bestStreak,
      streak,
      totalSpawned,
      round,
      timeLeft,
      elapsedSeconds,
      activeBalls: active.filter((ball): ball is ActiveBall => Boolean(ball)).map(({ slot, color }) => ({ slot, color })),
      colorStats: {
        red: { ...colorStats.red },
        blue: { ...colorStats.blue },
        green: { ...colorStats.green },
        yellow: { ...colorStats.yellow },
      },
    };
  };

  const publish = (force = false) => {
    const now = performance.now();
    if (!force && now - lastPublishedAt < 70) return;
    lastPublishedAt = now;
    const current = snapshot();
    listeners.forEach((listener) => listener(current));
  };

  const deactivate = (slot: number, wasMissed = false) => {
    active[slot] = null;
    setBallVisible(slot, false);
    if (wasMissed) missed += 1;
  };

  const spawnBall = () => {
    if (status !== "playing") return;
    const freeSlots = active.map((ball, index) => (ball ? -1 : index)).filter((index) => index >= 0);
    if (!freeSlots.length) return;
    const slot = freeSlots[Math.floor(Math.random() * freeSlots.length)];
    const color = randomColor();
    const now = performance.now();
    active[slot] = { slot, color, spawnedAt: now, expiresAt: now + BALL_LIFETIME };
    totalSpawned += 1;
    round += 1;
    setBallVisible(slot, true, color);
    const layout = layoutFor(engine);
    ballMeshes[slot].scaling = new Vector3(layout.ballSize, layout.ballSize * 0.2, layout.ballSize);
  };

  const finish = () => {
    if (status !== "playing") return;
    active.forEach((ball, slot) => {
      if (ball) deactivate(slot, true);
    });
    status = "finished";
    publish(true);
  };

  const start = () => {
    resetBalls();
    status = "playing";
    targetColor = randomColor();
    score = 0;
    correct = 0;
    wrong = 0;
    missed = 0;
    bestStreak = 0;
    streak = 0;
    totalSpawned = 0;
    round = 0;
    colorStats = cloneStats();
    startedAt = performance.now();
    endsAt = startedAt + GAME_DURATION * 1000;
    lastSpawnAt = 0;
    for (let index = 0; index < 3; index += 1) spawnBall();
    publish(true);
  };

  const hitBall = (slot: number) => {
    const ball = active[slot];
    if (status !== "playing" || !ball) return;
    const hitColor = ball.color;
    const isCorrect = hitColor === targetColor;
    const stats = colorStats[hitColor];
    stats.attempts += 1;
    if (isCorrect) {
      correct += 1;
      score += 2;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      stats.correct += 1;
    } else {
      wrong += 1;
      score -= 1;
      streak = 0;
    }
    deactivate(slot);
    targetColor = randomColor(targetColor);
    publish(true);
  };

  const onPointer = scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return;
    const picked = pointerInfo.pickInfo?.pickedMesh;
    const slot = picked?.metadata?.slot;
    if (typeof slot === "number") hitBall(slot);
  });
  const onResize = engine.onResizeObservable.add(layoutScene);
  const onBeforeRender = scene.onBeforeRenderObservable.add(() => {
    if (status !== "playing") return;
    const now = performance.now();
    if (now >= endsAt) {
      finish();
      return;
    }
    active.forEach((ball, slot) => {
      if (!ball) return;
      if (now >= ball.expiresAt) {
        deactivate(slot, true);
        return;
      }
      const progress = Math.min(1, (now - ball.spawnedAt) / 180);
      const pulse = Math.sin(now / 180 + slot) * 0.018;
      const scale = layoutFor(engine).ballSize * (Math.min(1, progress) + pulse);
      ballMeshes[slot].scaling.x = scale;
      ballMeshes[slot].scaling.z = scale;
      ballMeshes[slot].scaling.y = scale;
    });
    if (now - lastSpawnAt > Math.max(510, 780 - correct * 4)) {
      lastSpawnAt = now;
      spawnBall();
    }
    publish();
  });

  const initialColors: BallColor[] = ["red", "blue", "green", "yellow"];
  initialColors.forEach((color, slot) => {
    active[slot] = { slot, color, spawnedAt: 0, expiresAt: Number.POSITIVE_INFINITY };
    setBallVisible(slot, true, color);
  });

  return {
    scene,
    start,
    hitBall,
    subscribe: (listener) => {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    getSnapshot: snapshot,
    dispose: () => {
      onPointer.remove();
      onResize.remove();
      onBeforeRender.remove();
      listeners.clear();
      scene.dispose();
    },
  };
}

export const GAME_RULES = {
  duration: GAME_DURATION,
  correctPoints: 2,
  wrongPoints: -1,
  missedPoints: 0,
};

export const COLOR_META = PALETTE;
