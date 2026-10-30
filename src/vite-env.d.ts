/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCKS: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_REALTIME_URL: string
  readonly VITE_HTTP_TIMEOUT_MS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
