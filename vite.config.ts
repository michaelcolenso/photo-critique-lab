import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      thresholds: { lines: 85, statements: 80, branches: 75, functions: 90 },
      include: [
        'src/lib/analysis/{analyze,clipping,histogram,luminance,sharpness}.ts',
        'src/lib/image/crop.ts',
        'src/lib/critique/{crop-diversity,crop-validation}.ts',
        'src/lib/server/{critique,proxy-validation}.ts',
        'src/lib/telemetry/events.ts'
      ]
    }
  }
});
