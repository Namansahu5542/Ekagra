import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene } from "../game/scene";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current || !canvasRef.current) return;
    mountedRef.current = true;
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
    let disposed = false;

    createGameScene(engine, canvas).then((handle) => {
      if (disposed) {
        handle.dispose();
        engine.dispose();
        return;
      }
      engine.runRenderLoop(() => handle.scene.render());
      const onResize = () => engine.resize();
      window.addEventListener("resize", onResize);
      (canvas as HTMLCanvasElement & { __gardenCleanup?: () => void }).__gardenCleanup = () => {
        window.removeEventListener("resize", onResize);
        handle.dispose();
        engine.dispose();
      };
    });

    return () => {
      disposed = true;
      (canvas as HTMLCanvasElement & { __gardenCleanup?: () => void }).__gardenCleanup?.();
      mountedRef.current = false;
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="game-canvas" />;
}
