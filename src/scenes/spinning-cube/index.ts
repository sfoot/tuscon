import type { SceneDefinition } from '../../engine/scene';
import { mat4 } from '../../engine/math';
import shaderSource from './shader.wgsl?raw';

// Each face: normal, color, and the two in-plane axes used to build its corners.
type Face = { n: [number, number, number]; u: [number, number, number]; v: [number, number, number]; color: [number, number, number] };

const FACES: Face[] = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], color: [0.95, 0.35, 0.35] }, // +X
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], color: [0.35, 0.85, 0.85] }, // -X
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], color: [0.4, 0.9, 0.45] }, // +Y
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], color: [0.9, 0.4, 0.9] }, // -Y
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], color: [0.4, 0.55, 0.95] }, // +Z
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], color: [0.95, 0.8, 0.35] }, // -Z
];

const FLOATS_PER_VERTEX = 9; // position(3) + normal(3) + color(3)

function buildCube(): { vertices: Float32Array; indices: Uint16Array } {
  const vertices: number[] = [];
  const indices: number[] = [];
  FACES.forEach(({ n, u, v, color }, f) => {
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      vertices.push(
        n[0] + su * u[0] + sv * v[0],
        n[1] + su * u[1] + sv * v[1],
        n[2] + su * u[2] + sv * v[2],
        ...n,
        ...color,
      );
    }
    const b = f * 4;
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3); // counter-clockwise
  });
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
}

export const spinningCube: SceneDefinition = {
  id: 'spinning-cube',
  title: 'Spinning Cube',
  description: 'A lit, colored cube rotating on two axes.',

  create({ device, format }) {
    const { vertices, indices } = buildCube();

    const vertexBuffer = device.createBuffer({
      label: 'cube vertices',
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    const indexBuffer = device.createBuffer({
      label: 'cube indices',
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, indices);

    const uniformBuffer = device.createBuffer({
      label: 'cube uniforms',
      size: 2 * 64, // two mat4x4f
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const module = device.createShaderModule({ label: 'cube shader', code: shaderSource });
    const depthFormat: GPUTextureFormat = 'depth24plus';

    const pipeline = device.createRenderPipeline({
      label: 'cube pipeline',
      layout: 'auto',
      vertex: {
        module,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: FLOATS_PER_VERTEX * 4,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' },
            { shaderLocation: 2, offset: 24, format: 'float32x3' },
          ],
        }],
      },
      fragment: { module, entryPoint: 'fs_main', targets: [{ format }] },
      primitive: { topology: 'triangle-list', cullMode: 'back', frontFace: 'ccw' },
      depthStencil: { format: depthFormat, depthWriteEnabled: true, depthCompare: 'less' },
    });

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    let depthTexture: GPUTexture | null = null;
    const view = mat4.lookAt([0, 1.5, 5], [0, 0, 0], [0, 1, 0]);
    const projection = mat4.create();
    const model = mat4.create();
    const mvp = mat4.create();
    const rotY = mat4.create();
    const uniformData = new Float32Array(32);

    return {
      resize(width, height) {
        depthTexture?.destroy();
        depthTexture = device.createTexture({
          label: 'cube depth',
          size: [width, height],
          format: depthFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        mat4.perspective((60 * Math.PI) / 180, width / height, 0.1, 100, projection);
      },

      frame({ encoder, target, time }) {
        if (!depthTexture) return;

        mat4.rotationX(time * 0.7, model);
        mat4.multiply(mat4.rotationY(time, rotY), model, model);
        mat4.multiply(view, model, mvp);
        mat4.multiply(projection, mvp, mvp);
        uniformData.set(mvp, 0);
        uniformData.set(model, 16);
        device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: target,
            clearValue: { r: 0.06, g: 0.07, b: 0.1, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          }],
          depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
          },
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setIndexBuffer(indexBuffer, 'uint16');
        pass.drawIndexed(indices.length);
        pass.end();
      },

      destroy() {
        vertexBuffer.destroy();
        indexBuffer.destroy();
        uniformBuffer.destroy();
        depthTexture?.destroy();
      },
    };
  },
};
