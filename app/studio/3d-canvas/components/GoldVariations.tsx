import React from 'react';
import { Text } from '@react-three/drei';

interface GoldVariation {
    id: string;
    name: string;
    color: string;
    roughness: number;
    metalness: number;
}

const GOLD_VARIATIONS: GoldVariation[] = [
    // Row 1: Standard & Polished
    { id: 'gold-std', name: 'Standard Gold', color: '#FFD700', roughness: 0.15, metalness: 1.0 },
    { id: 'gold-mirror', name: 'Mirror Gold', color: '#FFD700', roughness: 0.0, metalness: 1.0 },
    { id: 'gold-polish', name: 'High Polish', color: '#FFD700', roughness: 0.05, metalness: 1.0 },
    { id: 'gold-satin', name: 'Satin Gold', color: '#FFD700', roughness: 0.3, metalness: 1.0 },
    { id: 'gold-matte', name: 'Matte Gold', color: '#FFD700', roughness: 0.6, metalness: 1.0 },

    // Row 2: Tints (Rose, White, Rich)
    { id: 'gold-rose', name: 'Rose Gold', color: '#B76E79', roughness: 0.15, metalness: 1.0 },
    { id: 'gold-white', name: 'White Gold', color: '#F5F5F5', roughness: 0.1, metalness: 1.0 },
    { id: 'gold-rich', name: 'Rich Gold', color: '#FFC125', roughness: 0.15, metalness: 1.0 },
    { id: 'gold-pale', name: 'Pale Gold', color: '#E6C288', roughness: 0.15, metalness: 1.0 },
    { id: 'gold-champagne', name: 'Champagne', color: '#F7E7CE', roughness: 0.15, metalness: 1.0 },

    // Row 3: Aged & Experimental
    { id: 'gold-aged', name: 'Aged Gold', color: '#CFB53B', roughness: 0.4, metalness: 0.9 },
    { id: 'gold-dark', name: 'Dark Gold', color: '#AA6C39', roughness: 0.2, metalness: 1.0 },
    { id: 'gold-rough-cast', name: 'Rough Cast', color: '#FFD700', roughness: 0.8, metalness: 1.0 },
    { id: 'gold-semi', name: 'Semi-Metal', color: '#FFD700', roughness: 0.2, metalness: 0.7 },
    { id: 'gold-plastic', name: 'Fake Gold', color: '#FFD700', roughness: 0.1, metalness: 0.0 },
];

export function GoldVariations() {
    return (
        <group position={[0, 2, 0]}>
            <Text
                position={[0, 4, 0]}
                fontSize={0.8}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                Gold Variations Review
            </Text>

            {GOLD_VARIATIONS.map((gold, index) => {
                const row = Math.floor(index / 5);
                const col = index % 5;
                const x = (col - 2) * 2.5;
                const y = -(row - 1) * 2.5;

                return (
                    <group key={gold.id} position={[x, y, 0]}>
                        {/* Label */}
                        <Text
                            position={[0, 1.2, 0]}
                            fontSize={0.25}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {gold.name}
                        </Text>
                        <Text
                            position={[0, 0.9, 0]}
                            fontSize={0.15}
                            color="#aaa"
                            anchorX="center"
                            anchorY="middle"
                        >
                            R:{gold.roughness} M:{gold.metalness}
                        </Text>

                        {/* Sphere */}
                        <mesh castShadow receiveShadow>
                            <sphereGeometry args={[0.8, 64, 64]} />
                            <meshStandardMaterial
                                color={gold.color}
                                roughness={gold.roughness}
                                metalness={gold.metalness}
                                envMapIntensity={1.0}
                            />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}
