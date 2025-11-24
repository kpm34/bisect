/**
 * Screenshot Utilities
 *
 * Provides utilities for capturing, processing, and optimizing screenshots
 * for AI vision analysis.
 */

/**
 * Screenshot format options
 */
export type ScreenshotFormat = 'png' | 'jpeg';

/**
 * Screenshot quality (0-100, only for JPEG)
 */
export type ScreenshotQuality = number;

/**
 * Screenshot capture options
 */
export interface ScreenshotCaptureOptions {
    format?: ScreenshotFormat;
    quality?: ScreenshotQuality;
    maxWidth?: number;
    maxHeight?: number;
}

/**
 * Screenshot data
 */
export interface ScreenshotData {
    dataUrl: string;
    format: ScreenshotFormat;
    width?: number;
    height?: number;
    size: number;
    timestamp: number;
}

/**
 * Screenshot result with metadata
 */
export interface ScreenshotResult {
    success: boolean;
    data?: ScreenshotData;
    error?: string;
}

/**
 * Screenshot Utilities
 */
export class ScreenshotUtils {
    /**
     * Capture screenshot of current tab
     */
    static async captureTab(
        options: ScreenshotCaptureOptions = {}
    ): Promise<ScreenshotResult> {
        const {
            format = 'png',
            quality = 92,
        } = options;

        try {
            // Check if Chrome extension API is available
            if (typeof chrome === 'undefined' || !chrome?.tabs?.captureVisibleTab) {
                return {
                    success: false,
                    error: 'Chrome extension API not available',
                };
            }

            // Capture visible tab
            const dataUrl = await chrome.tabs.captureVisibleTab({
                format,
                quality,
            });

            // Get dimensions if possible
            const dimensions = await this.getImageDimensions(dataUrl);

            // Calculate size
            const size = this.estimateDataUrlSize(dataUrl);

            return {
                success: true,
                data: {
                    dataUrl,
                    format,
                    width: dimensions?.width,
                    height: dimensions?.height,
                    size,
                    timestamp: Date.now(),
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Screenshot capture failed',
            };
        }
    }

    /**
     * Resize screenshot to reduce token usage for AI
     */
    static async resizeScreenshot(
        dataUrl: string,
        maxWidth: number,
        maxHeight: number
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const { width, height } = img;

                // Calculate new dimensions maintaining aspect ratio
                let newWidth = width;
                let newHeight = height;

                if (width > maxWidth || height > maxHeight) {
                    const widthRatio = maxWidth / width;
                    const heightRatio = maxHeight / height;
                    const ratio = Math.min(widthRatio, heightRatio);

                    newWidth = Math.floor(width * ratio);
                    newHeight = Math.floor(height * ratio);
                }

                // Create canvas for resizing
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Draw resized image
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                // Convert to data URL
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        });
    }

    /**
     * Compress screenshot for transmission
     */
    static async compressScreenshot(
        dataUrl: string,
        quality: number = 0.8
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        });
    }

    /**
     * Get image dimensions from data URL
     */
    static async getImageDimensions(
        dataUrl: string
    ): Promise<{ width: number; height: number } | null> {
        return new Promise((resolve) => {
            const img = new Image();

            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };

            img.onerror = () => resolve(null);
            img.src = dataUrl;
        });
    }

    /**
     * Estimate data URL size in bytes
     */
    static estimateDataUrlSize(dataUrl: string): number {
        // Base64 encoding adds ~33% overhead
        // Remove the data:image/... prefix
        const base64 = dataUrl.split(',')[1] || '';
        return Math.ceil((base64.length * 3) / 4);
    }

    /**
     * Format size in human-readable format
     */
    static formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /**
     * Check if screenshot is too large for AI processing
     */
    static isScreenshotTooLarge(
        dataUrl: string,
        maxSizeBytes: number = 5 * 1024 * 1024 // 5MB default
    ): boolean {
        return this.estimateDataUrlSize(dataUrl) > maxSizeBytes;
    }

    /**
     * Prepare screenshot for AI vision API
     * - Resizes if needed
     * - Compresses to reduce token usage
     * - Returns optimized data URL
     */
    static async prepareForAI(
        dataUrl: string,
        options: {
            maxWidth?: number;
            maxHeight?: number;
            maxSizeBytes?: number;
            quality?: number;
        } = {}
    ): Promise<string> {
        const {
            maxWidth = 1280,
            maxHeight = 720,
            maxSizeBytes = 5 * 1024 * 1024,
            quality = 0.85,
        } = options;

        let optimized = dataUrl;

        // Resize if too large
        const dimensions = await this.getImageDimensions(dataUrl);
        if (dimensions && (dimensions.width > maxWidth || dimensions.height > maxHeight)) {
            optimized = await this.resizeScreenshot(optimized, maxWidth, maxHeight);
        }

        // Compress if still too large
        if (this.isScreenshotTooLarge(optimized, maxSizeBytes)) {
            optimized = await this.compressScreenshot(optimized, quality);
        }

        return optimized;
    }

    /**
     * Extract base64 data from data URL
     */
    static extractBase64(dataUrl: string): string {
        return dataUrl.split(',')[1] || '';
    }

    /**
     * Get mime type from data URL
     */
    static getMimeType(dataUrl: string): string | null {
        const match = dataUrl.match(/^data:([^;]+);/);
        return match ? match[1] : null;
    }

    /**
     * Validate data URL format
     */
    static isValidDataUrl(dataUrl: string): boolean {
        return /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(dataUrl);
    }

    /**
     * Create a thumbnail from screenshot
     */
    static async createThumbnail(
        dataUrl: string,
        width: number = 200,
        height: number = 150
    ): Promise<string> {
        return this.resizeScreenshot(dataUrl, width, height);
    }
}

export default ScreenshotUtils;
