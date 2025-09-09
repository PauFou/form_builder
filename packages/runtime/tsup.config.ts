import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/ssr.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  noExternal: ['mitt', 'idb'],
  esbuildOptions(options) {
    options.drop = ['console', 'debugger'];
    options.pure = ['console.log'];
    options.target = 'es2020';
  },
});