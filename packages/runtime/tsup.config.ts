import { defineConfig } from 'tsup';

export default defineConfig([
  // Main runtime bundle (vanilla JS, <30KB target)
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    minify: 'terser',
    treeshake: true,
    external: [],
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        ecma: 2020,
        module: true,
        toplevel: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true
      },
      mangle: {
        toplevel: true,
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false,
        ecma: 2020
      }
    },
    esbuildOptions(options) {
      options.target = 'es2020';
      options.keepNames = false;
      options.metafile = true;
      options.bundle = true;
      options.platform = 'browser';
      options.mainFields = ['module', 'main'];
      options.conditions = ['import', 'module', 'browser', 'default'];
      options.treeShaking = true;
      options.minifyWhitespace = true;
      options.minifyIdentifiers = true;
      options.minifySyntax = true;
      options.charset = 'utf8';
    },
    onSuccess: async () => {
      // Log bundle size
      const fs = await import('fs');
      const path = await import('path');
      const distPath = path.resolve('dist/index.js');
      const stats = await fs.promises.stat(distPath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      console.log(`\n✨ Runtime bundle size: ${sizeInKB}KB`);
      if (stats.size > 30 * 1024) {
        console.warn('⚠️  Warning: Bundle size exceeds 30KB target!');
      }
    }
  },
  // SSR bundle (for server-side rendering)
  {
    entry: ['src/ssr.ts'],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: false,
    external: ['react', 'react-dom'],
    esbuildOptions(options) {
      options.platform = 'node';
      options.target = 'node18';
    }
  },
  // React component bundle (separate, optional)
  {
    entry: ['src/FormViewer.tsx'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: true,
    external: ['react', 'react-dom'],
    esbuildOptions(options) {
      options.target = 'es2020';
      options.jsx = 'automatic';
    }
  }
]);