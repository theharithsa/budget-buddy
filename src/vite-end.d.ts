/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

// Dynatrace RUM API
interface DynatraceRUM {
  identifyUser: (email: string) => void;
  enterAction: (name: string) => void;
  leaveAction: () => void;
  sendEvent: (name: string, data?: any) => void;
  addActionProperties: (properties: Record<string, any>) => void;
}

declare global {
  interface Window {
    dtrum?: DynatraceRUM;
  }
}