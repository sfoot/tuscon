import type { GpuContext } from './scene';

export class WebGpuUnsupportedError extends Error {}

/** Request a GPU device and configure the canvas for WebGPU rendering. */
export async function initGpu(canvas: HTMLCanvasElement): Promise<GpuContext> {
  if (!('gpu' in navigator)) {
    throw new WebGpuUnsupportedError('This browser does not expose WebGPU (navigator.gpu is missing).');
  }

  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) {
    throw new WebGpuUnsupportedError('WebGPU is available, but no suitable GPU adapter was found.');
  }

  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new WebGpuUnsupportedError('Could not create a WebGPU canvas context.');
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'opaque' });

  return { device, format, canvas };
}
