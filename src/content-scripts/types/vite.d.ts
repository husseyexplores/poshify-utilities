interface ImportMeta {
  __dirname: string
  env: {
    MODE: 'development' | 'production' | 'preview' | 'TEST'
    VITE_SHOPIFY_API_VER: 'string'
  }
}
