import type { GpuContext, SceneDefinition, SceneInstance } from './scene';

/**
 * Owns the canvas, the render loop and the active scene.
 * Switching scenes destroys the old one and creates the new one.
 */
export class Engine {
  private readonly context: GPUCanvasContext;
  private scene: SceneInstance | null = null;
  private sceneStart = 0;
  private lastFrame = 0;
  private width = 0;
  private height = 0;
  private rafId = 0;
  private switchToken = 0;

  constructor(private readonly gpu: GpuContext) {
    this.context = gpu.canvas.getContext('webgpu')!;
    this.observeSize();
  }

  async setScene(def: SceneDefinition): Promise<void> {
    const token = ++this.switchToken;
    this.scene?.destroy();
    this.scene = null;

    const instance = await def.create(this.gpu);
    if (token !== this.switchToken) {
      // Another scene was selected while this one was loading.
      instance.destroy();
      return;
    }

    this.scene = instance;
    if (this.width > 0) instance.resize?.(this.width, this.height);
    this.sceneStart = performance.now();
    this.lastFrame = this.sceneStart;
  }

  start(): void {
    const tick = (now: number) => {
      this.rafId = requestAnimationFrame(tick);
      this.renderFrame(now);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
  }

  private renderFrame(now: number): void {
    if (!this.scene || this.width === 0 || this.height === 0) return;

    const dt = Math.min((now - this.lastFrame) / 1000, 0.1);
    this.lastFrame = now;

    const encoder = this.gpu.device.createCommandEncoder();
    this.scene.frame({
      encoder,
      target: this.context.getCurrentTexture().createView(),
      width: this.width,
      height: this.height,
      time: (now - this.sceneStart) / 1000,
      dt,
    });
    this.gpu.device.queue.submit([encoder.finish()]);
  }

  /** Keep the canvas backing size matched to its displayed size in device pixels. */
  private observeSize(): void {
    const { canvas, device } = this.gpu;
    const maxSize = device.limits.maxTextureDimension2D;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const box = entry.devicePixelContentBoxSize?.[0];
      const w = box ? box.inlineSize : Math.round(entry.contentRect.width * devicePixelRatio);
      const h = box ? box.blockSize : Math.round(entry.contentRect.height * devicePixelRatio);
      this.width = canvas.width = Math.max(1, Math.min(w, maxSize));
      this.height = canvas.height = Math.max(1, Math.min(h, maxSize));
      this.scene?.resize?.(this.width, this.height);
    });

    try {
      observer.observe(canvas, { box: 'device-pixel-content-box' });
    } catch {
      observer.observe(canvas); // Safari fallback
    }
  }
}
