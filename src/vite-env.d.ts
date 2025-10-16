/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ZOOM_API_KEY: string
  readonly VITE_ZOOM_API_SECRET: string
  readonly VITE_ZOOM_ACCOUNT_ID: string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
