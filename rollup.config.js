import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: './assets/js/index.js',
  output: {
    file: './assets/js/rollup.bundle.js',
    format: 'iife',
    inlineDynamicImports: true,
    minify: true,
  },
  plugins: [nodeResolve()],
};