import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";

export type GameHandle = {
  scene: Scene;
  dispose: () => void;
};

export async function createGameScene(engine: Engine, _canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 0, 0);

  const camera = new FreeCamera("garden-camera", new Vector3(0, 0, -14), scene);
  camera.setTarget(Vector3.Zero());
  camera.mode = FreeCamera.ORTHOGRAPHIC_CAMERA;
  camera.orthoLeft = -10;
  camera.orthoRight = 10;
  camera.orthoTop = 6;
  camera.orthoBottom = -6;

  const light = new HemisphericLight("soft-garden-light", new Vector3(0, 1, -1), scene);
  light.intensity = 0.7;
  light.diffuse = new Color3(1, 0.96, 0.82);
  light.groundColor = new Color3(0.32, 0.48, 0.37);

  const nodes: Array<{ mesh: Mesh; baseX: number; baseY: number; speed: number; phase: number }> = [];
  const colors = ["#F7B3A0", "#F4CF69", "#9CCEE5", "#B7D6B0", "#F1E3BC"];
  const seed = [
    [-8.6, 4.7, 0.62, 0.6], [-6.9, 2.9, 0.32, 0.75], [-5.3, 5.1, 0.45, 0.9],
    [-3.3, 3.5, 0.26, 0.5], [-1.7, 5.2, 0.4, 0.8], [0.5, 3.6, 0.3, 0.7],
    [2.4, 5.1, 0.55, 0.55], [4.3, 3.1, 0.28, 0.9], [6.4, 4.6, 0.4, 0.65],
    [8.6, 2.8, 0.3, 0.8], [-8.1, -3.8, 0.35, 0.8], [-6.2, -4.8, 0.55, 0.6],
    [-4.1, -3.5, 0.24, 0.75], [-1.6, -4.7, 0.42, 0.9], [1.2, -3.5, 0.3, 0.6],
    [3.9, -4.6, 0.52, 0.85], [6.1, -3.5, 0.25, 0.65], [8.4, -4.8, 0.42, 0.7],
  ] as const;

  seed.forEach(([x, y, size, speed], i) => {
    const mesh = MeshBuilder.CreateDisc(`firefly-${i}`, { radius: size, tessellation: 18 }, scene);
    mesh.position = new Vector3(x, y, 1 + (i % 3) * 0.15);
    const material = new StandardMaterial(`firefly-material-${i}`, scene);
    material.diffuseColor = Color3.FromHexString(colors[i % colors.length]);
    material.emissiveColor = Color3.FromHexString(colors[i % colors.length]);
    material.alpha = 0.32 + (i % 3) * 0.08;
    material.disableLighting = true;
    mesh.material = material;
    mesh.isPickable = false;
    nodes.push({ mesh, baseX: x, baseY: y, speed, phase: i * 0.67 });
  });

  const onBeforeRender = () => {
    const t = performance.now() / 1000;
    nodes.forEach((node) => {
      node.mesh.position.x = node.baseX + Math.sin(t * node.speed + node.phase) * 0.12;
      node.mesh.position.y = node.baseY + Math.cos(t * node.speed * 0.8 + node.phase) * 0.11;
      const pulse = 0.92 + Math.sin(t * node.speed * 1.6 + node.phase) * 0.08;
      node.mesh.scaling.x = pulse;
      node.mesh.scaling.y = pulse;
    });
  };
  scene.onBeforeRenderObservable.add(onBeforeRender);

  return {
    scene,
    dispose: () => {
      scene.onBeforeRenderObservable.removeCallback(onBeforeRender);
      scene.dispose();
    },
  };
}
