// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Nuxt Modules
  // https://nuxt.com/modules
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
  ],
  // Development
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-08-14',
  nitro: {
    esbuild: {
      options: {
        target: 'ESNext',
      },
    },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        target: 'ESNext',
        module: 'ESNext',
        noErrorTruncation: true,
      },
    },
  },
})
