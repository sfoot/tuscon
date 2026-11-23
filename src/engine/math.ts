// Minimal 3D math, written from scratch.
//
// Conventions (chosen to match WGSL and WebGPU):
// - Matrices are 4x4, column-major, stored in a Float32Array of 16.
//   Element (row r, column c) lives at index c * 4 + r.
// - Right-handed world space; the camera looks down -Z.
// - Clip-space depth runs 0..1 (WebGPU), not -1..1 (WebGL).

export type Vec3 = [number, number, number];
export type Mat4 = Float32Array;

export const mat4 = {
  create(): Mat4 {
    return mat4.identity(new Float32Array(16));
  },

  identity(out: Mat4 = new Float32Array(16)): Mat4 {
    out.fill(0);
    out[0] = out[5] = out[10] = out[15] = 1;
    return out;
  },

  /** out = a * b (apply b first, then a). Safe when out aliases a or b. */
  multiply(a: Mat4, b: Mat4, out: Mat4 = new Float32Array(16)): Mat4 {
    const r = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let row = 0; row < 4; row++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[c * 4 + k];
        r[c * 4 + row] = sum;
      }
    }
    out.set(r);
    return out;
  },

  /** Perspective projection with WebGPU's 0..1 depth range. fovY in radians. */
  perspective(fovY: number, aspect: number, near: number, far: number, out: Mat4 = new Float32Array(16)): Mat4 {
    const f = 1 / Math.tan(fovY / 2);
    const rangeInv = 1 / (near - far);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = far * rangeInv;
    out[11] = -1;
    out[14] = near * far * rangeInv;
    return out;
  },

  /** View matrix for a camera at `eye` looking at `target`. */
  lookAt(eye: Vec3, target: Vec3, up: Vec3, out: Mat4 = new Float32Array(16)): Mat4 {
    const z = vec3.normalize(vec3.subtract(eye, target)); // camera backward
    const x = vec3.normalize(vec3.cross(up, z)); // camera right
    const y = vec3.cross(z, x); // camera up
    out[0] = x[0]; out[1] = y[0]; out[2] = z[0]; out[3] = 0;
    out[4] = x[1]; out[5] = y[1]; out[6] = z[1]; out[7] = 0;
    out[8] = x[2]; out[9] = y[2]; out[10] = z[2]; out[11] = 0;
    out[12] = -vec3.dot(x, eye);
    out[13] = -vec3.dot(y, eye);
    out[14] = -vec3.dot(z, eye);
    out[15] = 1;
    return out;
  },

  translation(v: Vec3, out: Mat4 = new Float32Array(16)): Mat4 {
    mat4.identity(out);
    out[12] = v[0]; out[13] = v[1]; out[14] = v[2];
    return out;
  },

  rotationX(rad: number, out: Mat4 = new Float32Array(16)): Mat4 {
    const c = Math.cos(rad), s = Math.sin(rad);
    mat4.identity(out);
    out[5] = c; out[6] = s;
    out[9] = -s; out[10] = c;
    return out;
  },

  rotationY(rad: number, out: Mat4 = new Float32Array(16)): Mat4 {
    const c = Math.cos(rad), s = Math.sin(rad);
    mat4.identity(out);
    out[0] = c; out[2] = -s;
    out[8] = s; out[10] = c;
    return out;
  },

  rotationZ(rad: number, out: Mat4 = new Float32Array(16)): Mat4 {
    const c = Math.cos(rad), s = Math.sin(rad);
    mat4.identity(out);
    out[0] = c; out[1] = s;
    out[4] = -s; out[5] = c;
    return out;
  },
};

export const vec3 = {
  subtract(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },
  cross(a: Vec3, b: Vec3): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  },
  dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },
  normalize(a: Vec3): Vec3 {
    const len = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / len, a[1] / len, a[2] / len];
  },
};
