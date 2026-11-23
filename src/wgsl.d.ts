// Lets TypeScript understand `import code from './shader.wgsl?raw'`.
declare module '*.wgsl?raw' {
  const source: string;
  export default source;
}
