# tuscon

WebGPU design experiments, published as a static site on GitHub Pages:
**https://sfoot.github.io/tuscon/**

The site is a single page with a scene picker. Each experiment is a *scene*
that plugs into a small engine written from scratch, with no 3D library.

## Running locally

Requires Node.js 22+ and a WebGPU-capable browser (current Chrome or Edge, Safari 26+).

```sh
npm install
npm run dev        # dev server with live reload → http://localhost:5173/tuscon/
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Layout

```
index.html                  page shell: canvas, scene picker, "no WebGPU" notice
src/main.ts                 boots WebGPU, fills the picker, switches scenes via URL hash
src/engine/
  gpu.ts                    adapter/device/canvas setup + unsupported-browser detection
  engine.ts                 render loop, canvas resizing, scene lifecycle
  scene.ts                  the Scene interface every experiment implements
  math.ts                   hand-written mat4/vec3 (column-major, WebGPU 0..1 depth)
src/scenes/
  index.ts                  scene registry (first entry is the default)
  spinning-cube/            the first experiment: index.ts + shader.wgsl
.github/workflows/deploy.yml  builds and publishes to GitHub Pages on push to main
```

## Adding a new experiment

1. Create `src/scenes/<your-scene>/index.ts` exporting a `SceneDefinition`
   (`id`, `title`, `create()`), plus any `.wgsl` shaders. Import shaders with
   `import code from './shader.wgsl?raw'`.
2. In `create()`, build pipelines and buffers, then return an object with
   `frame()` (record passes into the given command encoder), optional
   `resize()`, and `destroy()`.
3. Add it to the array in `src/scenes/index.ts`.

Each scene is selectable from the picker and linkable as `…/tuscon/#<id>`.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes `dist/` to GitHub Pages. One-time setup: in the repo on GitHub, go to
**Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
