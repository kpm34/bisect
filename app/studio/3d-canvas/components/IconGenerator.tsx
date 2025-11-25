import React from 'react';

interface GoldVariation {
    id: string;
    name: string;
    color: string;
    roughness: number;
    metalness: number;
}

const GOLD_VARIATIONS: GoldVariation[] = [
    // Mirror Gold (Index 0)
    { id: 'gold-mirror', name: 'Mirror Gold', color: '#FFD700', roughness: 0.0, metalness: 1.0 },
    // Aged Gold (Index 1)
    { id: 'gold-aged', name: 'Aged Gold', color: '#CFB53B', roughness: 0.4, metalness: 0.9 },
    // Matte Gold (Index 2)
    { id: 'gold-matte', name: 'Matte Gold', color: '#FFD700', roughness: 0.6, metalness: 1.0 },
    // Semi-Metal (Index 3)
    { id: 'gold-semi', name: 'Semi-Metal', color: '#FFD700', roughness: 0.2, metalness: 0.7 },
];

export function IconGenerator({ index = 0 }: { index?: number }) {
    const gold = GOLD_VARIATIONS[index] || GOLD_VARIATIONS[0];

    return (
        <group position={[0, 0, 0]}>
            {/* Sphere - Large and centered */}
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[2.5, 64, 64]} />
                <meshStandardMaterial
                    color={gold.color}
                    roughness={gold.roughness}
                    metalness={gold.metalness}
                    envMapIntensity={1.0}
                />
            </mesh>
        </group>
    );
}
