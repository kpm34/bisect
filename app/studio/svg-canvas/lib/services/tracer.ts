export interface TracerConfig {
  ltres?: number; // Linear error (lower = more detail)
  qtres?: number; // Quadratic error (lower = more detail)
  pathomit?: number; // Remove paths shorter than this
  colorsampling?: number; // 0=disabled, 1=random, 2=deterministic
  numberofcolors?: number;
  mincolorratio?: number;
  colorquantcycles?: number;
  scale?: number;
  simplify?: number; // Custom smoothing
  timeout?: number; // Timeout in ms
}

/**
 * Trace a bitmap image to SVG using imagetracerjs (algorithmic, no AI)
 * Includes timeout protection and image size limiting
 */
export const traceBitmap = async (
  imageUrl: string,
  config: TracerConfig = {}
): Promise<string> => {
  // Dynamic import to avoid SSR issues - imagetracerjs uses DOM APIs
  const ImageTracer = (await import('imagetracerjs')).default;

  const timeout = config.timeout ?? 30000; // 30 second default timeout

  return new Promise((resolve, reject) => {
    // Set timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      reject(new Error(`Image tracing timed out after ${timeout}ms`));
    }, timeout);

    const options = {
      ltres: config.ltres ?? 1,
      qtres: config.qtres ?? 1,
      pathomit: config.pathomit ?? 8,
      colorsampling: config.colorsampling ?? 2, // Deterministic
      numberofcolors: config.numberofcolors ?? 16,
      mincolorratio: config.mincolorratio ?? 0,
      colorquantcycles: config.colorquantcycles ?? 3,
      scale: config.scale ?? 1,
      strokewidth: 1,
      linefilter: true,
    };

    console.log('[tracer] Starting trace with options:', options);

    try {
      // ImageTracer.imageToSVG takes a URL/URI, callback, and options
      ImageTracer.imageToSVG(
        imageUrl,
        (svgString: string) => {
          clearTimeout(timeoutId);
          console.log('[tracer] Trace complete, SVG length:', svgString?.length);
          if (!svgString) {
            reject(new Error("Tracing failed to produce SVG"));
            return;
          }
          resolve(svgString);
        },
        options
      );
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[tracer] Trace error:', err);
      reject(err);
    }
  });
};

/**
 * Resize image before tracing to prevent performance issues
 * Returns a data URL of the resized image
 */
export const resizeImageForTracing = (
  dataUrl: string,
  maxDimension: number = 1024
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Only resize if larger than max dimension
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        console.log(`[tracer] Resizing image from ${img.width}x${img.height} to ${width}x${height}`);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = dataUrl;
  });
};

