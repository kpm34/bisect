/// <reference types="vite/client" />

// Extend ImportMeta to include env for both Vite and Next.js
interface ImportMeta {
  env?: {
    DEV?: boolean;
    PROD?: boolean;
    MODE?: string;
    [key: string]: any;
  };
}

// Chrome Extension API types (optional, for browser extension context)
declare const chrome: {
  storage?: {
    local: {
      get: (keys: string[]) => Promise<Record<string, any>>;
      set: (items: Record<string, any>) => Promise<void>;
    };
  };
  tabs?: {
    captureVisibleTab: (options?: { format?: string }) => Promise<string>;
  };
} | undefined;

// AI Studio API (optional, for AI Studio extension context)
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
