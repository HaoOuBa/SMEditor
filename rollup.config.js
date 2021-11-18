import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: './assets/js/index.js',
  output: {
    file: './assets/js/SMEditor.bundle.js',
    format: 'iife',
    inlineDynamicImports: true
  },
  plugins: process.env.NODE_ENV === 'development' ? [nodeResolve()] : [nodeResolve(), terser({ compress: { drop_console: true } })],
};