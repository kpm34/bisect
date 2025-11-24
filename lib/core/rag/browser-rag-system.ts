/**
 * Browser-Compatible RAG System
 *
 * Provides memory and learning capabilities for the browser agent
 * using fetch-based ChromaDB client and OpenAI embeddings
 */

import { BrowserChromaClient, type BrowserChromaDocument } from './browser-chroma-client';
import type { SimilarEdit, SceneData } from '../ai/unified-spline-agent';

export interface BrowserRAGConfig {
  chromaConfig?: {
    host?: string;
    port?: number;
    collectionName?: string;
  };
  openaiApiKey?: string;
  embeddingModel?: string;
  similarityThreshold?: number;
  maxResults?: number;
}

export interface SuccessfulEdit {
  command: string;
  outcome: string;
  code?: string;
  sceneData?: SceneData;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Browser-compatible RAG system using fetch-based ChromaDB
 */
export class BrowserRAGSystem {
  private chromaClient: BrowserChromaClient;
  private openaiApiKey: string;
  private embeddingModel: string;
  private similarityThreshold: number;
  private maxResults: number;
  private initialized = false;

  constructor(config: BrowserRAGConfig = {}) {
    this.chromaClient = new BrowserChromaClient(config.chromaConfig);
    this['openaiApiKey'] = config['openaiApiKey'] || '';
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
    this.similarityThreshold = config.similarityThreshold || 0.7;
    this.maxResults = config.maxResults || 5;
  }

  /**
   * Initialize the RAG system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Test ChromaDB connection first
    const isConnected = await this.chromaClient.testConnection();
    if (!isConnected) {
      console.warn('⚠️ ChromaDB not accessible, RAG disabled');
      // Don't throw - allow system to work without RAG
      return;
    }

    try {
      await this.chromaClient.initialize();
      this.initialized = true;
      console.log('✅ Browser RAG system initialized');
    } catch (error) {
      console.warn('⚠️ RAG initialization failed, continuing without memory:', error);
      // Don't throw - allow system to work without RAG
    }
  }

  /**
   * Generate embedding using OpenAI API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this['openaiApiKey']) {
      throw new Error('OpenAI API key required for embeddings');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this['openaiApiKey']}`
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate embedding: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Retrieve similar edits from memory
   */
  async retrieveSimilarEdits(
    command: string,
    sceneData: SceneData
  ): Promise<SimilarEdit[]> {
    if (!this.initialized) {
      console.warn('⚠️ RAG not initialized, returning empty results');
      return [];
    }

    try {
      // Create search text from command and scene context
      const searchText = this._buildSearchText(command, sceneData);

      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(searchText);

      // Query ChromaDB for similar documents
      const results = await this.chromaClient.query(queryEmbedding, this.maxResults);

      // Filter by similarity threshold and transform to SimilarEdit format
      const similarEdits: SimilarEdit[] = results
        .filter(r => (1 - r.distance) >= this.similarityThreshold) // Convert distance to similarity
        .map(r => ({
          command: r.metadata.command,
          outcome: r.metadata.outcome,
          similarity: 1 - r.distance, // Distance to similarity score
          code: r.document // Store code in document field
        }));

      console.log(`🔍 Found ${similarEdits.length} similar edits (threshold: ${this.similarityThreshold})`);
      return similarEdits;
    } catch (error) {
      console.error('❌ Error retrieving similar edits:', error);
      return [];
    }
  }

  /**
   * Store a successful edit in memory
   */
  async storeSuccessfulEdit(edit: SuccessfulEdit): Promise<void> {
    if (!this.initialized) {
      console.warn('⚠️ RAG not initialized, skipping storage');
      return;
    }

    try {
      // Create search text for embedding
      const searchText = this._buildSearchText(edit.command, edit.sceneData);

      // Generate embedding
      const embedding = await this.generateEmbedding(searchText);

      // Create document
      const document: BrowserChromaDocument = {
        id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        embedding,
        metadata: {
          command: edit.command,
          outcome: edit.outcome,
          timestamp: edit.timestamp || Date.now(),
          ...edit.metadata
        },
        document: edit.code || edit.outcome // Store code or outcome as document
      };

      // Store in ChromaDB
      await this.chromaClient.add([document]);
      console.log('✅ Stored successful edit in RAG memory');
    } catch (error) {
      console.error('❌ Error storing edit:', error);
      // Don't throw - allow system to continue without memory
    }
  }

  /**
   * Build search text from command and scene context
   */
  private _buildSearchText(command: string, sceneData?: SceneData): string {
    const parts = [command];

    if (sceneData) {
      // Add object count and types
      if (sceneData.objects && Array.isArray(sceneData.objects)) {
        const objectTypes = sceneData.objects.map(obj => (obj as any).type || 'object');
        parts.push(`scene with ${objectTypes.length} objects: ${objectTypes.join(', ')}`);
      }

      // Add selected objects
      if (sceneData.selectedObjects && sceneData.selectedObjects.length > 0) {
        parts.push(`selected: ${sceneData.selectedObjects.join(', ')}`);
      }
    }

    return parts.join(' | ');
  }

  /**
   * Get RAG system statistics
   */
  async getStats(): Promise<{ totalPatterns: number; collectionName: string }> {
    if (!this.initialized) {
      return { totalPatterns: 0, collectionName: 'not initialized' };
    }

    try {
      const stats = await this.chromaClient.getStats();
      return {
        totalPatterns: stats.count,
        collectionName: stats.name
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return { totalPatterns: 0, collectionName: 'error' };
    }
  }
}
