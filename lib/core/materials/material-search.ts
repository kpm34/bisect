/**
 * Material Search System
 *
 * Semantic search for materials using ChromaDB and OpenAI embeddings.
 * Enables natural language queries like "rustic wood" or "shiny metal".
 */

import type { MaterialPreset } from './types';
import { BrowserChromaClient, type BrowserChromaDocument } from '../rag/browser-chroma-client';

export interface MaterialSearchConfig {
  chromaConfig?: {
    host?: string;
    port?: number;
  };
  openaiApiKey?: string;
  embeddingModel?: string;
  maxResults?: number;
}

export interface MaterialSearchResult {
  material: MaterialPreset;
  score: number; // Similarity score (0-1)
  distance: number; // Vector distance
}

/**
 * Material search system using ChromaDB
 */
export class MaterialSearchSystem {
  private chromaClient: BrowserChromaClient;
  private openaiApiKey: string;
  private embeddingModel: string;
  private maxResults: number;
  private materials: Map<string, MaterialPreset> = new Map();
  private initialized: boolean = false;

  constructor(config: MaterialSearchConfig = {}) {
    this.chromaClient = new BrowserChromaClient({
      host: config.chromaConfig?.host,
      port: config.chromaConfig?.port,
      collectionName: 'materials',
    });

    this.openaiApiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || '';
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
    this.maxResults = config.maxResults || 10;
  }

  /**
   * Initialize the search system
   */
  async initialize(): Promise<void> {
    try {
      await this.chromaClient.initialize();
      this.initialized = true;
      console.info('[MaterialSearch] Initialized with ChromaDB');
    } catch (error) {
      console.warn('[MaterialSearch] ChromaDB not available:', error);
      this.initialized = false;
    }
  }

  /**
   * Generate OpenAI embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: this.embeddingModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('[MaterialSearch] Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Index a single material
   */
  async indexMaterial(material: MaterialPreset): Promise<void> {
    if (!this.initialized) {
      console.warn('[MaterialSearch] Not initialized, skipping indexing');
      return;
    }

    // Cache material
    this.materials.set(material.id, material);

    // Create document text for embedding
    const document = `${material.name} ${material.category} ${material.tags?.join(' ') || ''}`;

    // Generate embedding
    const embedding = await this.generateEmbedding(document);

    // Create metadata
    const metadata = {
      id: material.id,
      name: material.name,
      category: material.category,
      hasTextures: !!material.textures,
      roughness: material.uniforms.nodeU5 || 0.5,
      metalness: material.uniforms.nodeU6 || 0,
      opacity: material.uniforms.nodeU1 || 1,
      tags: material.tags?.join(', ') || '',
      source: material.source || '',
    };

    // Store in ChromaDB
    const chromaDoc: BrowserChromaDocument = {
      id: material.id,
      document,
      metadata,
      embedding,
    };

    await this.chromaClient.add([chromaDoc]);
  }

  /**
   * Index multiple materials in batch
   */
  async indexMaterials(materials: MaterialPreset[]): Promise<void> {
    for (const material of materials) {
      try {
        await this.indexMaterial(material);
      } catch (error) {
        console.error(`[MaterialSearch] Failed to index material ${material.id}:`, error);
      }
    }
  }

  /**
   * Search for materials using natural language query
   */
  async search(query: string, maxResults?: number): Promise<MaterialSearchResult[]> {
    if (!this.initialized) {
      console.warn('[MaterialSearch] Not initialized, returning empty results');
      return [];
    }

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Query ChromaDB
    const results = await this.chromaClient.query(
      queryEmbedding,
      maxResults || this.maxResults
    );

    if (!results || results.length === 0) {
      return [];
    }

    // Convert to MaterialSearchResult format
    const searchResults: MaterialSearchResult[] = [];

    for (const result of results) {
      const { id, distance } = result;

      // Find material by ID from our cache
      const material = this.materials.get(id);
      if (!material) continue;

      searchResults.push({
        material,
        score: Math.max(0, 1 - distance),
        distance,
      });
    }

    return searchResults;
  }

  /**
   * Clear all indexed materials
   */
  async clear(): Promise<void> {
    if (!this.initialized) return;
    // Note: ChromaDB reset not exposed in browser client
    this.materials.clear();
  }
}
