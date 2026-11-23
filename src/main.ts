import './style.css';
import { Engine } from './engine/engine';
import { initGpu, WebGpuUnsupportedError } from './engine/gpu';
import { scenes } from './scenes';

const canvas = document.querySelector<HTMLCanvasElement>('#gpu-canvas')!;
const select = document.querySelector<HTMLSelectElement>('#scene-select')!;
const description = document.querySelector<HTMLElement>('#scene-description')!;
const notice = document.querySelector<HTMLElement>('#notice')!;

function showNotice(title: string, detail: string): void {
  notice.hidden = false;
  notice.querySelector('h2')!.textContent = title;
  notice.querySelector('.detail')!.textContent = detail;
}

function sceneFromHash() {
  const id = location.hash.slice(1);
  return scenes.find((s) => s.id === id) ?? scenes[0];
}

async function main(): Promise<void> {
  let gpu;
  try {
    gpu = await initGpu(canvas);
  } catch (err) {
    if (err instanceof WebGpuUnsupportedError) {
      showNotice('WebGPU isn’t available', err.message);
    } else {
      showNotice('Something went wrong starting WebGPU', String(err));
    }
    return;
  }

  gpu.device.lost.then((info) => {
    if (info.reason !== 'destroyed') {
      showNotice('The GPU device was lost', `${info.message} Reload the page to try again.`);
    }
  });

  for (const scene of scenes) {
    select.add(new Option(scene.title, scene.id));
  }

  const engine = new Engine(gpu);
  const activate = async () => {
    const scene = sceneFromHash();
    select.value = scene.id;
    description.textContent = scene.description ?? '';
    document.title = `${scene.title} · tuscon`;
    await engine.setScene(scene);
  };

  select.addEventListener('change', () => {
    location.hash = select.value; // triggers hashchange → activate
  });
  window.addEventListener('hashchange', activate);

  await activate();
  engine.start();
}

main();
