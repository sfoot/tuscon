// The contract every experiment ("scene") implements.
//
// A scene is registered as a SceneDefinition. When selected, the engine calls
// `create()` once to build GPU resources, then `frame()` every animation frame,
// and `destroy()` when switching away.
//
// Scenes record their own render (or compute) passes into the provided command
// encoder, so each experiment is free to use multiple passes, its own depth
// buffer, post-processing, and so on.

export interface GpuContext {
  device: GPUDevice;
  /** Preferred texture format of the canvas. */
  format: GPUTextureFormat;
  canvas: HTMLCanvasElement;
}

export interface FrameContext {
  encoder: GPUCommandEncoder;
  /** The canvas texture view to draw into this frame. */
  target: GPUTextureView;
  /** Canvas size in physical pixels. */
  width: number;
  height: number;
  /** Seconds since the scene was created. */
  time: number;
  /** Seconds since the previous frame. */
  dt: number;
}

export interface SceneInstance {
  frame(ctx: FrameContext): void;
  /** Called when the canvas size changes (physical pixels). */
  resize?(width: number, height: number): void;
  /** Release GPU resources. */
  destroy(): void;
}

export interface SceneDefinition {
  /** URL-safe id, used in the page hash (e.g. #spinning-cube). */
  id: string;
  title: string;
  description?: string;
  create(gpu: GpuContext): SceneInstance | Promise<SceneInstance>;
}
