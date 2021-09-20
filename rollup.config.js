import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: './assets/js/SMEditor.js',
  output: {
    file: './assets/js/SMEditor.bundle.js',
    format: 'iife',
    inlineDynamicImports: true,
    minify: true,
  },
  plugins: [nodeResolve()],
};