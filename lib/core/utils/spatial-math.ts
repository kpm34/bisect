/**
 * Spatial Math Functions Library
 *
 * Provides mathematical functions for spatial layouts and transformations
 * in 3D space. Used by the AI agent for arranging objects in scenes.
 */

/**
 * 3D Vector type
 */
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

/**
 * 2D Vector type (for planar layouts)
 */
export interface Vector2 {
    x: number;
    y: number;
}

/**
 * Bounding box type
 */
export interface BoundingBox {
    min: Vector3;
    max: Vector3;
}

/**
 * Grid layout parameters
 */
export interface GridLayoutParams {
    spacing: number;
    columns: number;
    rows?: number;
    plane?: 'xy' | 'xz' | 'yz';
}

/**
 * Circle layout parameters
 */
export interface CircleLayoutParams {
    radius: number;
    startAngle?: number;
    endAngle?: number;
    plane?: 'xy' | 'xz' | 'yz';
}

/**
 * Spiral layout parameters
 */
export interface SpiralLayoutParams {
    spacing: number;
    turns: number;
    radiusGrowth: number;
    plane?: 'xy' | 'xz' | 'yz';
}

/**
 * Wave layout parameters
 */
export interface WaveLayoutParams {
    amplitude: number;
    frequency: number;
    spacing: number;
    axis?: 'x' | 'y' | 'z';
}

/**
 * Scatter layout parameters
 */
export interface ScatterLayoutParams {
    area: BoundingBox;
    seed?: number;
    avoidOverlap?: boolean;
    minDistance?: number;
}

/**
 * Alignment options
 */
export type AlignmentType = 'min' | 'center' | 'max';

/**
 * Axis type for operations
 */
export type Axis = 'x' | 'y' | 'z';

/**
 * Spatial Math Functions
 */
export class SpatialMath {
    /**
     * Arrange objects in a grid layout
     */
    static arrangeInGrid(
        count: number,
        params: GridLayoutParams,
        centerOrigin = true
    ): Vector3[] {
        const { spacing, columns, plane = 'xy' } = params;
        const positions: Vector3[] = [];

        for (let i = 0; i < count; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);

            let position: Vector3;
            switch (plane) {
                case 'xy':
                    position = {
                        x: col * spacing,
                        y: row * spacing,
                        z: 0,
                    };
                    break;
                case 'xz':
                    position = {
                        x: col * spacing,
                        y: 0,
                        z: row * spacing,
                    };
                    break;
                case 'yz':
                    position = {
                        x: 0,
                        y: col * spacing,
                        z: row * spacing,
                    };
                    break;
            }

            positions.push(position);
        }

        // Center around origin if requested
        if (centerOrigin) {
            const center = this.calculateCenter(positions);
            return positions.map(p => this.subtract(p, center));
        }

        return positions;
    }

    /**
     * Arrange objects in a circular layout
     */
    static arrangeInCircle(
        count: number,
        params: CircleLayoutParams
    ): Vector3[] {
        const {
            radius,
            startAngle = 0,
            endAngle = Math.PI * 2,
            plane = 'xy',
        } = params;

        const positions: Vector3[] = [];
        const angleRange = endAngle - startAngle;
        const angleStep = angleRange / Math.max(count, 1);

        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            let position: Vector3;
            switch (plane) {
                case 'xy':
                    position = { x, y, z: 0 };
                    break;
                case 'xz':
                    position = { x, y: 0, z: y };
                    break;
                case 'yz':
                    position = { x: 0, y: x, z: y };
                    break;
            }

            positions.push(position);
        }

        return positions;
    }

    /**
     * Arrange objects in a spiral layout
     */
    static arrangeInSpiral(
        count: number,
        params: SpiralLayoutParams
    ): Vector3[] {
        const {
            spacing,
            turns,
            radiusGrowth,
            plane = 'xy',
        } = params;

        const positions: Vector3[] = [];
        const totalAngle = turns * Math.PI * 2;
        const angleStep = totalAngle / Math.max(count, 1);

        for (let i = 0; i < count; i++) {
            const angle = angleStep * i;
            const radius = radiusGrowth * (angle / (Math.PI * 2));
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            let position: Vector3;
            switch (plane) {
                case 'xy':
                    position = { x, y, z: i * spacing };
                    break;
                case 'xz':
                    position = { x, y: i * spacing, z: y };
                    break;
                case 'yz':
                    position = { x: i * spacing, y: x, z: y };
                    break;
            }

            positions.push(position);
        }

        return positions;
    }

    /**
     * Arrange objects along a wave
     */
    static arrangeInWave(
        count: number,
        params: WaveLayoutParams
    ): Vector3[] {
        const {
            amplitude,
            frequency,
            spacing,
            axis = 'x',
        } = params;

        const positions: Vector3[] = [];

        for (let i = 0; i < count; i++) {
            const t = i * spacing;
            const waveValue = Math.sin(t * frequency) * amplitude;

            let position: Vector3;
            switch (axis) {
                case 'x':
                    position = { x: t, y: waveValue, z: 0 };
                    break;
                case 'y':
                    position = { x: waveValue, y: t, z: 0 };
                    break;
                case 'z':
                    position = { x: 0, y: waveValue, z: t };
                    break;
            }

            positions.push(position);
        }

        return positions;
    }

    /**
     * Scatter objects randomly within an area
     */
    static scatterObjects(
        count: number,
        params: ScatterLayoutParams
    ): Vector3[] {
        const {
            area,
            seed = Math.random(),
            avoidOverlap = false,
            minDistance = 0,
        } = params;

        const positions: Vector3[] = [];
        const rng = this.seededRandom(seed);

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let position: Vector3;

            do {
                position = {
                    x: this.lerp(area.min.x, area.max.x, rng()),
                    y: this.lerp(area.min.y, area.max.y, rng()),
                    z: this.lerp(area.min.z, area.max.z, rng()),
                };
                attempts++;
            } while (
                avoidOverlap &&
                attempts < 100 &&
                this.isTooClose(position, positions, minDistance)
            );

            positions.push(position);
        }

        return positions;
    }

    /**
     * Align objects along an axis
     */
    static alignObjects(
        positions: Vector3[],
        axis: Axis,
        alignment: AlignmentType
    ): Vector3[] {
        if (positions.length === 0) return [];

        const values = positions.map(p => p[axis]);
        let targetValue: number;

        switch (alignment) {
            case 'min':
                targetValue = Math.min(...values);
                break;
            case 'max':
                targetValue = Math.max(...values);
                break;
            case 'center':
                targetValue = (Math.min(...values) + Math.max(...values)) / 2;
                break;
        }

        return positions.map(p => ({
            ...p,
            [axis]: targetValue,
        }));
    }

    /**
     * Distribute objects evenly along an axis
     */
    static distributeObjects(
        positions: Vector3[],
        axis: Axis,
        spacing?: number
    ): Vector3[] {
        if (positions.length <= 1) return positions;

        // Sort by axis value
        const sorted = [...positions].sort((a, b) => a[axis] - b[axis]);

        if (spacing !== undefined) {
            // Fixed spacing mode
            const startValue = sorted[0][axis];
            return sorted.map((p, i) => ({
                ...p,
                [axis]: startValue + i * spacing,
            }));
        } else {
            // Even distribution mode
            const minValue = sorted[0][axis];
            const maxValue = sorted[sorted.length - 1][axis];
            const step = (maxValue - minValue) / (sorted.length - 1);

            return sorted.map((p, i) => ({
                ...p,
                [axis]: minValue + i * step,
            }));
        }
    }

    /**
     * Calculate the center point of positions
     */
    static calculateCenter(positions: Vector3[]): Vector3 {
        if (positions.length === 0) {
            return { x: 0, y: 0, z: 0 };
        }

        const sum = positions.reduce(
            (acc, p) => ({
                x: acc.x + p.x,
                y: acc.y + p.y,
                z: acc.z + p.z,
            }),
            { x: 0, y: 0, z: 0 }
        );

        return {
            x: sum.x / positions.length,
            y: sum.y / positions.length,
            z: sum.z / positions.length,
        };
    }

    /**
     * Calculate distance between two points
     */
    static distance(a: Vector3, b: Vector3): number {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Add two vectors
     */
    static add(a: Vector3, b: Vector3): Vector3 {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z,
        };
    }

    /**
     * Subtract two vectors
     */
    static subtract(a: Vector3, b: Vector3): Vector3 {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z,
        };
    }

    /**
     * Scale a vector
     */
    static scale(v: Vector3, scalar: number): Vector3 {
        return {
            x: v.x * scalar,
            y: v.y * scalar,
            z: v.z * scalar,
        };
    }

    /**
     * Linear interpolation between two values
     */
    static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    /**
     * Check if a position is too close to existing positions
     */
    private static isTooClose(
        position: Vector3,
        existing: Vector3[],
        minDistance: number
    ): boolean {
        for (const other of existing) {
            if (this.distance(position, other) < minDistance) {
                return true;
            }
        }
        return false;
    }

    /**
     * Seeded random number generator
     */
    private static seededRandom(seed: number): () => number {
        let state = seed;
        return () => {
            // LCG algorithm
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    }

    /**
     * Rotate a point around an axis
     */
    static rotateAroundAxis(
        point: Vector3,
        axis: Axis,
        angle: number
    ): Vector3 {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        switch (axis) {
            case 'x':
                return {
                    x: point.x,
                    y: point.y * cos - point.z * sin,
                    z: point.y * sin + point.z * cos,
                };
            case 'y':
                return {
                    x: point.x * cos + point.z * sin,
                    y: point.y,
                    z: -point.x * sin + point.z * cos,
                };
            case 'z':
                return {
                    x: point.x * cos - point.y * sin,
                    y: point.x * sin + point.y * cos,
                    z: point.z,
                };
        }
    }

    /**
     * Create a bounding box from positions
     */
    static getBoundingBox(positions: Vector3[]): BoundingBox {
        if (positions.length === 0) {
            return {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 0, y: 0, z: 0 },
            };
        }

        const min = { ...positions[0] };
        const max = { ...positions[0] };

        for (const p of positions) {
            min.x = Math.min(min.x, p.x);
            min.y = Math.min(min.y, p.y);
            min.z = Math.min(min.z, p.z);
            max.x = Math.max(max.x, p.x);
            max.y = Math.max(max.y, p.y);
            max.z = Math.max(max.z, p.z);
        }

        return { min, max };
    }

    /**
     * Normalize a vector (make length 1)
     */
    static normalize(v: Vector3): Vector3 {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        if (length === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: v.x / length,
            y: v.y / length,
            z: v.z / length,
        };
    }

    /**
     * Dot product of two vectors
     */
    static dot(a: Vector3, b: Vector3): number {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    /**
     * Cross product of two vectors
     */
    static cross(a: Vector3, b: Vector3): Vector3 {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x,
        };
    }
}

export default SpatialMath;
