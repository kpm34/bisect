/**
 * Semantic Scene Graph Builder
 * 
 * Analyzes raw 3D scene data (positions, bounds) to infer semantic relationships
 * between objects (e.g., "on top of", "next to", "inside").
 * 
 * This transforms a flat list of objects into a rich web of context for the AI.
 */

export interface SceneNode {
    id: string;
    name: string;
    type: string;
    position: { x: number, y: number, z: number };
    bounds?: { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } };
}

export interface SceneEdge {
    source: string;
    target: string;
    relation: 'on_top_of' | 'next_to' | 'inside' | 'above' | 'below' | 'near';
    confidence: number;
}

export interface SemanticSceneGraph {
    nodes: SceneNode[];
    edges: SceneEdge[];
    summary: string;
}

export class SceneGraphBuilder {

    /**
     * Builds a semantic scene graph from raw scene data.
     */
    static buildGraph(sceneData: any): SemanticSceneGraph {
        const nodes: SceneNode[] = [];
        const edges: SceneEdge[] = [];

        // 1. Extract Nodes
        // Assuming sceneData.objects is an array or map of objects
        // This is a simplified extraction logic
        const objects = Array.isArray(sceneData.objects) ? sceneData.objects : [];

        for (const obj of objects) {
            nodes.push({
                id: obj.uuid || obj.id || 'unknown',
                name: obj.name || 'Object',
                type: obj.type || 'Mesh',
                position: obj.position || { x: 0, y: 0, z: 0 },
                bounds: obj.bounds // Assuming bounds are pre-calculated or available
            });
        }

        // 2. Infer Relationships (Edges)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = 0; j < nodes.length; j++) {
                if (i === j) continue;

                const nodeA = nodes[i];
                const nodeB = nodes[j];

                const relation = this._inferRelation(nodeA, nodeB);
                if (relation) {
                    edges.push(relation);
                }
            }
        }

        // 3. Generate Summary
        const summary = this._generateSummary(nodes, edges);

        return { nodes, edges, summary };
    }

    /**
     * Infers the spatial relationship between two nodes.
     */
    private static _inferRelation(a: SceneNode, b: SceneNode): SceneEdge | null {
        // Simple distance-based heuristics
        // In a real implementation, we'd use bounding box intersection logic

        const dx = Math.abs(a.position.x - b.position.x);
        const dy = a.position.y - b.position.y; // +y is usually up
        const dz = Math.abs(a.position.z - b.position.z);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // "On Top Of" heuristic
        // A is above B, close in X/Z, and close vertically
        if (dy > 0 && dy < 200 && dx < 100 && dz < 100) { // Thresholds would depend on scale
            return { source: a.id, target: b.id, relation: 'on_top_of', confidence: 0.9 };
        }

        // "Next To" heuristic
        if (Math.abs(dy) < 50 && dist < 300 && dist > 50) {
            return { source: a.id, target: b.id, relation: 'next_to', confidence: 0.8 };
        }

        return null;
    }

    /**
     * Generates a natural language summary of the scene graph.
     */
    private static _generateSummary(nodes: SceneNode[], edges: SceneEdge[]): string {
        if (nodes.length === 0) return "The scene is empty.";

        let summary = `The scene contains ${nodes.length} objects. `;

        // Group relations by source to make sentences flow better
        const relationsBySource: Record<string, string[]> = {};

        for (const edge of edges) {
            if (!relationsBySource[edge.source]) relationsBySource[edge.source] = [];

            const sourceName = nodes.find(n => n.id === edge.source)?.name || edge.source;
            const targetName = nodes.find(n => n.id === edge.target)?.name || edge.target;

            relationsBySource[edge.source].push(`${edge.relation.replace(/_/g, ' ')} the ${targetName}`);
        }

        const sentences: string[] = [];
        for (const [sourceId, relations] of Object.entries(relationsBySource)) {
            const sourceName = nodes.find(n => n.id === sourceId)?.name || sourceId;
            sentences.push(`The ${sourceName} is ${relations.join(' and ')}.`);
        }

        if (sentences.length > 0) {
            summary += "Spatial Context: " + sentences.join(' ');
        } else {
            summary += "Objects are scattered without clear close relationships.";
        }

        return summary;
    }
}
