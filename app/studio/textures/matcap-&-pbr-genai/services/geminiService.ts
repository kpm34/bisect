import { GoogleGenAI } from "@google/genai";
import { TextureMode, ModelQuality } from "../types";

// Helper function to get API key from various sources
const getApiKey = (): string | undefined => {
  // When running in AI Studio, the @google/genai library can automatically
  // use the API key from window.aistudio if no apiKey is provided.
  
  // First, try build-time environment variable (from Vite define)
  // Vite replaces process.env.* at build time, so if not set, it becomes the string "undefined"
  const buildTimeKey = (process.env.GEMINI_API_KEY || process.env.API_KEY) as string | undefined;
  
  // Check if we have a valid key (not the string "undefined" or empty)
  if (buildTimeKey && 
      buildTimeKey !== 'undefined' && 
      buildTimeKey !== 'null' && 
      buildTimeKey.trim() !== '') {
    return buildTimeKey;
  }
  
  // If no build-time key and we're in AI Studio, return undefined
  // The GoogleGenAI library will automatically use the API key from window.aistudio
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    // When running in AI Studio, we can instantiate without apiKey
    // and the library will use the injected key
    return undefined;
  }
  
  // If neither source available, throw error
  throw new Error('No API key found. Please set GEMINI_API_KEY environment variable or use AI Studio to select an API key.');
};

export const generateTextureImage = async (
  prompt: string,
  mode: TextureMode,
  quality: ModelQuality,
  resolution: '1K' | '2K' = '1K'
): Promise<string> => {
  // Get API key from available sources
  let apiKey: string | undefined;
  try {
    apiKey = getApiKey();
  } catch (error) {
    // If getApiKey throws, it means no API key was found
    // But if we're in AI Studio, we can still try without explicit key
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      apiKey = undefined; // Will try without explicit key
    } else {
      throw error; // Re-throw if not in AI Studio
    }
  }
  
  // Initialize GoogleGenAI
  // If apiKey is undefined, we're in AI Studio and the library should use window.aistudio's key
  // Note: The @google/genai library from AI Studio CDN may automatically inject the API key
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : (new GoogleGenAI() as any);

  // Force Pro model if resolution is 2K, otherwise use selected quality
  const modelName = (quality === ModelQuality.HIGH || resolution === '2K')
    ? 'gemini-3-pro-image-preview' 
    : 'gemini-2.5-flash-image';

  // Construct a specialized prompt based on the mode
  let finalPrompt = "";
  if (mode === TextureMode.MATCAP) {
    finalPrompt = `A high-quality 3D material capture (MatCap) sphere of ${prompt}. The image should be a single perfectly round sphere centered on a pitch black background, showcasing the lighting, reflection, and material properties cleanly. No other objects or background details.`;
  } else {
    finalPrompt = `A high-quality, seamless, top-down, flat texture pattern of ${prompt}. Even lighting, no shadows from external objects, tileable, 4k texture quality.`;
  }

  // Config varies by model
  const imageConfig: any = {
    aspectRatio: "1:1",
  };

  // imageSize is only supported by the Pro model
  // We check modelName instead of quality variable to ensure we cover the forced upgrade case
  if (modelName === 'gemini-3-pro-image-preview') {
    imageConfig.imageSize = resolution;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        imageConfig,
      },
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};