struct Uniforms {
  mvp: mat4x4f,
  model: mat4x4f,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexIn {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
};

struct VertexOut {
  @builtin(position) clip: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec3f,
};

@vertex
fn vs_main(in: VertexIn) -> VertexOut {
  var out: VertexOut;
  out.clip = u.mvp * vec4f(in.position, 1.0);
  // The model matrix is a pure rotation, so it transforms normals correctly.
  out.normal = (u.model * vec4f(in.normal, 0.0)).xyz;
  out.color = in.color;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4f {
  let lightDir = normalize(vec3f(0.4, 0.8, 0.6));
  let diffuse = max(dot(normalize(in.normal), lightDir), 0.0);
  let shade = 0.25 + 0.75 * diffuse;
  return vec4f(in.color * shade, 1.0);
}
