/// <reference types="vite/client.d.ts" />

declare global {
  interface Window {
    paso: {
      data: {
        mirrorDomain: string
      }
    }
  }
}

export {}
