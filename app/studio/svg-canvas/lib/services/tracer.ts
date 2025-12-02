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

/**
 * Detect and remove solid background from an image
 * Samples corners to detect background color and makes it transparent
 * Returns a data URL with transparent background
 */
export const removeBackground = (
  dataUrl: string,
  tolerance: number = 30
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample corners to detect background color
      const cornerSamples = [
        getPixelAt(data, canvas.width, 0, 0), // Top-left
        getPixelAt(data, canvas.width, canvas.width - 1, 0), // Top-right
        getPixelAt(data, canvas.width, 0, canvas.height - 1), // Bottom-left
        getPixelAt(data, canvas.width, canvas.width - 1, canvas.height - 1), // Bottom-right
      ];

      // Check if corners are similar (indicating a solid background)
      const bgColor = detectBackgroundColor(cornerSamples, tolerance);

      if (!bgColor) {
        console.log('[tracer] No uniform background detected, skipping removal');
        resolve(dataUrl);
        return;
      }

      console.log('[tracer] Detected background color:', bgColor);

      // Remove background by making matching pixels transparent
      let pixelsRemoved = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (colorMatch(r, g, b, bgColor, tolerance)) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
          pixelsRemoved++;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      console.log(`[tracer] Removed ${pixelsRemoved} background pixels`);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for background removal'));
    img.src = dataUrl;
  });
};

// Helper: Get pixel color at x, y
function getPixelAt(data: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number] {
  const idx = (y * width + x) * 4;
  return [data[idx], data[idx + 1], data[idx + 2]];
}

// Helper: Check if a color matches another within tolerance
function colorMatch(r: number, g: number, b: number, target: [number, number, number], tolerance: number): boolean {
  return (
    Math.abs(r - target[0]) <= tolerance &&
    Math.abs(g - target[1]) <= tolerance &&
    Math.abs(b - target[2]) <= tolerance
  );
}

// Helper: Detect if corners share a common background color
function detectBackgroundColor(
  samples: [number, number, number][],
  tolerance: number
): [number, number, number] | null {
  const [first, ...rest] = samples;

  // Check if all corners are similar to the first corner
  const allMatch = rest.every(sample =>
    colorMatch(sample[0], sample[1], sample[2], first, tolerance)
  );

  if (allMatch) {
    // Average the corner colors for the background
    const avgR = Math.round(samples.reduce((s, c) => s + c[0], 0) / samples.length);
    const avgG = Math.round(samples.reduce((s, c) => s + c[1], 0) / samples.length);
    const avgB = Math.round(samples.reduce((s, c) => s + c[2], 0) / samples.length);
    return [avgR, avgG, avgB];
  }

  return null;
}

