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
    captureVisibleTab: (options?: { format?: string; quality?: number }) => Promise<string>;
  };
} | undefined;

// AI Studio global types (for texture generation)
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}

// ImageTracer module declaration
declare module 'imagetracerjs' {
  interface TracerOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    layering?: number;
    strokewidth?: number;
    scale?: number;
    roundcoords?: number;
    lcpr?: number;
    qcpr?: number;
    desc?: boolean;
    viewbox?: boolean;
    blurradius?: number;
    blurdelta?: number;
  }

  interface ImageTracer {
    imageToSVG(
      url: string,
      callback: (svgString: string) => void,
      options?: TracerOptions | string
    ): void;
    imagedataToSVG(
      imgd: ImageData,
      options?: TracerOptions | string
    ): string;
  }

  const imagetracer: ImageTracer;
  export default imagetracer;
}
