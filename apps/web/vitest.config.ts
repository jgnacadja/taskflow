import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      all: true,
      include: ['components/**/*.vue', 'pages/**/*.vue']
    }
  }
})
