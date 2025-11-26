import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Types
export type TextureMode = 'MATCAP' | 'PBR';
export type ModelQuality = 'FAST' | 'HIGH';

interface GenerateRequest {
  prompt: string;
  mode: TextureMode;
  quality?: ModelQuality;
  resolution?: '1K' | '2K';
}

interface GenerateResponse {
  id: string;
  mode: TextureMode;
  prompt: string;
  albedo: string; // Base64 data URI
  normal?: string; // Base64 data URI (PBR only) - generated client-side
  roughness?: string; // Base64 data URI (PBR only) - generated client-side
  timestamp: number;
  resolution: '1K' | '2K';
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, mode, quality = 'HIGH', resolution = '1K' } = body;

    // Validate required fields
    if (!prompt || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and mode' },
        { status: 400 }
      );
    }

    if (!['MATCAP', 'PBR'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be MATCAP or PBR' },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Initialize GoogleGenAI (same SDK as frontend)
    const ai = new GoogleGenAI({ apiKey });

    // Select model based on quality/resolution (same as frontend)
    const modelName = (quality === 'HIGH' || resolution === '2K')
      ? 'gemini-2.0-flash-exp-image-generation'
      : 'gemini-2.0-flash-exp-image-generation';

    // Construct specialized prompt based on mode
    let finalPrompt = '';
    if (mode === 'MATCAP') {
      finalPrompt = `A high-quality 3D material capture (MatCap) sphere of ${prompt}. The image should be a single perfectly round sphere centered on a pitch black background, showcasing the lighting, reflection, and material properties cleanly. No other objects or background details.`;
    } else {
      finalPrompt = `A high-quality, seamless, top-down, flat texture pattern of ${prompt}. Even lighting, no shadows from external objects, tileable, 4k texture quality.`;
    }

    // Image generation config
    const imageConfig: Record<string, unknown> = {
      aspectRatio: '1:1',
    };

    // Generate content with image output
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        ...imageConfig,
      } as any,
    });

    // Extract image from response
    const parts = response.candidates?.[0]?.content?.parts || [];
    let imageData: string | null = null;

    for (const part of parts) {
      if ((part as any).inlineData) {
        const inlineData = (part as any).inlineData;
        imageData = `data:image/png;base64,${inlineData.data}`;
        break;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        {
          error: 'No image data returned from Gemini. The model may not support image generation.',
          suggestion: 'Try a different prompt or use the UI at /studio/tex-factory'
        },
        { status: 500 }
      );
    }

    const responseData: GenerateResponse = {
      id: crypto.randomUUID(),
      mode,
      prompt,
      albedo: imageData,
      timestamp: Date.now(),
      resolution,
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Tex Factory API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate texture' },
      { status: 500 }
    );
  }
}

// GET endpoint for health check and documentation
export async function GET() {
  return NextResponse.json({
    service: 'Tex Factory API',
    version: '1.0.0',
    endpoints: {
      'POST /api/tex-factory/generate': {
        description: 'Generate textures using AI (Gemini image generation)',
        body: {
          prompt: 'string (required) - Description of the texture',
          mode: 'MATCAP | PBR (required) - Texture type',
          quality: 'FAST | HIGH (optional, default: HIGH)',
          resolution: '1K | 2K (optional, default: 1K)',
        },
        response: {
          id: 'string - Unique texture ID',
          mode: 'MATCAP | PBR',
          prompt: 'string',
          albedo: 'string - Base64 data URI of the generated texture',
          timestamp: 'number - Unix timestamp',
          resolution: '1K | 2K',
        }
      }
    },
    notes: [
      'Uses Gemini 2.0 Flash with image generation capabilities',
      'PBR normal and roughness maps should be generated client-side from the albedo',
      'For interactive generation with live preview, use the UI at /studio/tex-factory'
    ]
  });
}
