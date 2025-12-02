/**
 * Browser-Compatible ChromaDB Client
 *
 * Lightweight wrapper around ChromaDB's REST API using fetch()
 * instead of the chromadb NPM package (which has Node.js dependencies)
 */

export interface BrowserChromaMetadata {
  command?: string;
  outcome?: string;
  timestamp?: number;
  [key: string]: any;
}

export interface BrowserChromaDocument {
  id: string;
  embedding: number[];
  metadata: BrowserChromaMetadata;
  document: string;
}

export interface BrowserChromaQueryResult {
  id: string;
  distance: number;
  metadata: BrowserChromaMetadata;
  document: string;
}

export interface BrowserChromaConfig {
  host?: string;
  port?: number;
  collectionName?: string;
}

/**
 * Browser-compatible ChromaDB client using fetch()
 */
export class BrowserChromaClient {
  private baseUrl: string;
  private collectionName: string;
  private initialized = false;

  constructor(config: BrowserChromaConfig = {}) {
    const host = config.host || 'localhost';
    const port = config.port || 8000;
    this.collectionName = config.collectionName || 'spline-patterns';
    this.baseUrl = `http://${host}:${port}`;
  }

  /**
   * Initialize and ensure collection exists
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check if collection exists
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}`);

      if (response.status === 404) {
        // Create collection if it doesn't exist
        await fetch(`${this.baseUrl}/api/v1/collections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.collectionName,
            metadata: { description: 'Spline AI command patterns' }
          })
        });
        console.log(`✅ Created ChromaDB collection: ${this.collectionName}`);
      } else if (response.ok) {
        console.log(`✅ Connected to ChromaDB collection: ${this.collectionName}`);
      } else {
        throw new Error(`Failed to access collection: ${response.statusText}`);
      }

      this.initialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize ChromaDB: ${message}`);
    }
  }

  /**
   * Add documents to the collection
   */
  async add(documents: BrowserChromaDocument[]): Promise<void> {
    if (!this.initialized) {
      throw new Error('ChromaDB client not initialized');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: documents.map(d => d.id),
        embeddings: documents.map(d => d.embedding),
        metadatas: documents.map(d => d.metadata),
        documents: documents.map(d => d.document)
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to add documents: ${response.statusText}`);
    }
  }

  /**
   * Query for similar documents
   */
  async query(
    queryEmbedding: number[],
    nResults: number = 5
  ): Promise<BrowserChromaQueryResult[]> {
    if (!this.initialized) {
      throw new Error('ChromaDB client not initialized');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_embeddings: [queryEmbedding],
        n_results: nResults
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to query documents: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform ChromaDB response format to our interface
    const results: BrowserChromaQueryResult[] = [];
    const ids = data.ids[0] || [];
    const distances = data.distances[0] || [];
    const metadatas = data.metadatas[0] || [];
    const documents = data.documents[0] || [];

    for (let i = 0; i < ids.length; i++) {
      results.push({
        id: ids[i],
        distance: distances[i],
        metadata: metadatas[i],
        document: documents[i]
      });
    }

    return results;
  }

  /**
   * Get collection stats
   */
  async getStats(): Promise<{ count: number; name: string }> {
    if (!this.initialized) {
      throw new Error('ChromaDB client not initialized');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}`);

    if (!response.ok) {
      throw new Error(`Failed to get stats: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      count: data.count || 0,
      name: this.collectionName
    };
  }

  /**
   * Test connection to ChromaDB
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/heartbeat`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
