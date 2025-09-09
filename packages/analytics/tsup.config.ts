import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  treeshake: true,
  minify: true,
  sourcemap: true,
  splitting: false,
  target: 'es2020',
  esbuildOptions(options) {
    options.drop = ['console', 'debugger']
    options.pure = ['console.log']
  },
})