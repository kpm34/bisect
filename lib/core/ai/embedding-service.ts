/**
 * OpenAI Embedding Service
 *
 * Generates vector embeddings for text using OpenAI's embedding models.
 * Supports contextual embeddings that include scene information.
 */

import OpenAI from 'openai';
import type { SceneData } from './unified-spline-agent';

/**
 * Embedding configuration
 */
export interface EmbeddingConfig {
  model?: string;
  apiKey?: string;
  dimensions?: number;
}

/**
 * Embedding result
 */
export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  embeddings: number[][];
  totalTokens: number;
  model: string;
}

/**
 * OpenAI Embedding Service
 *
 * Generates 1536-dimensional vector embeddings using OpenAI's
 * text-embedding-3-small model (~$0.02/1M tokens).
 */
export class EmbeddingService {
  private openai: OpenAI;
  private model: string;
  private dimensions: number;
  private cache: Map<string, number[]>;
  private cacheEnabled: boolean;

  constructor(config: EmbeddingConfig = {}) {
    this.openai = new OpenAI({
      apiKey: config.apiKey || process.env['OPENAI_API_KEY'],
    });

    // Use text-embedding-3-small for best cost/performance
    // ($0.02/1M tokens vs $0.13/1M for ada-002)
    this.model = config.model || 'text-embedding-3-small';
    this.dimensions = config.dimensions || 1536;
    this.cache = new Map();
    this.cacheEnabled = true;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    // Check cache first
    if (this.cacheEnabled && this.cache.has(text)) {
      return {
        embedding: this.cache.get(text)!,
        tokens: 0, // Cached, no tokens used
        model: this.model,
      };
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      });

      const embedding = response.data[0].embedding;

      // Cache the result
      if (this.cacheEnabled) {
        this.cache.set(text, embedding);
      }

      return {
        embedding,
        tokens: response.usage.total_tokens,
        model: this.model,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate embedding: ${message}`);
    }
  }

  /**
   * Generate contextual embedding that includes scene information
   *
   * This creates a richer embedding by combining the command with
   * relevant scene context, improving retrieval accuracy.
   */
  async generateContextualEmbedding(
    command: string,
    sceneData?: SceneData
  ): Promise<EmbeddingResult> {
    // Build contextual text
    const contextParts: string[] = [command];

    if (sceneData) {
      // Add number of objects
      if (sceneData.objects) {
        const objectCount = Object.keys(sceneData.objects).length;
        contextParts.push(`Scene has ${objectCount} objects.`);
      }

      // Add object types if available
      if (sceneData.objects) {
        const objectTypes = new Set<string>();
        Object.values(sceneData.objects).forEach((obj: any) => {
          if (obj.type) {
            objectTypes.add(obj.type);
          }
        });
        if (objectTypes.size > 0) {
          contextParts.push(`Object types: ${Array.from(objectTypes).join(', ')}.`);
        }
      }

      // Add any scene-level metadata
      if (sceneData.timestamp) {
        // Include recency as context (optional)
        const age = Date.now() - sceneData.timestamp;
        if (age < 60000) {
          contextParts.push('Recent scene.');
        }
      }
    }

    const contextualText = contextParts.join(' ');
    return this.generateEmbedding(contextualText);
  }

  /**
   * Generate embeddings for multiple texts in batch
   *
   * More efficient than calling generateEmbedding() multiple times.
   */
  async generateBatchEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) {
      return {
        embeddings: [],
        totalTokens: 0,
        model: this.model,
      };
    }

    // Check cache for all texts
    const uncachedTexts: string[] = [];
    const cachedEmbeddings: Map<number, number[]> = new Map();

    texts.forEach((text, index) => {
      if (this.cacheEnabled && this.cache.has(text)) {
        cachedEmbeddings.set(index, this.cache.get(text)!);
      } else {
        uncachedTexts.push(text);
      }
    });

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      return {
        embeddings: texts.map((_, i) => cachedEmbeddings.get(i)!),
        totalTokens: 0,
        model: this.model,
      };
    }

    try {
      // Generate embeddings for uncached texts
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: uncachedTexts,
        dimensions: this.dimensions,
      });

      // Cache new embeddings
      const newEmbeddings = response.data.map((d) => d.embedding);
      if (this.cacheEnabled) {
        uncachedTexts.forEach((text, i) => {
          this.cache.set(text, newEmbeddings[i]);
        });
      }

      // Merge cached and new embeddings in correct order
      const allEmbeddings: number[][] = [];
      let uncachedIndex = 0;

      texts.forEach((_text, i) => {
        if (cachedEmbeddings.has(i)) {
          allEmbeddings.push(cachedEmbeddings.get(i)!);
        } else {
          allEmbeddings.push(newEmbeddings[uncachedIndex++]);
        }
      });

      return {
        embeddings: allEmbeddings,
        totalTokens: response.usage.total_tokens,
        model: this.model,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate batch embeddings: ${message}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   *
   * Returns a value between -1 and 1, where 1 is identical,
   * 0 is orthogonal, and -1 is opposite.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Convert ChromaDB distance to similarity score (0-1)
   *
   * ChromaDB returns L2 distance (lower is better).
   * This converts it to a 0-1 similarity score (higher is better).
   */
  distanceToSimilarity(distance: number): number {
    // L2 distance is typically in range [0, 2] for normalized vectors
    // Convert to similarity: 0 distance = 1.0 similarity
    return Math.max(0, 1 - distance / 2);
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    enabled: boolean;
  } {
    return {
      size: this.cache.size,
      enabled: this.cacheEnabled,
    };
  }

  /**
   * Enable or disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Calculate estimated cost for embedding text
   *
   * @param tokenCount Number of tokens (rough estimate: 1 token ≈ 4 characters)
   * @returns Cost in dollars
   */
  estimateCost(tokenCount: number): number {
    // text-embedding-3-small: $0.02 per 1M tokens
    return (tokenCount / 1_000_000) * 0.02;
  }

  /**
   * Estimate token count from text
   *
   * Rough approximation: 1 token ≈ 4 characters (for English)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export default EmbeddingService;
