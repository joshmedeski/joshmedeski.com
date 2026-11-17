import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./setupTests'],
    include: [
      './src/**/*.test.ts',
      './video/*.test.ts',
      './functions/__test__/*.test.ts',
    ],
  },
})
