import React, { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RiggedAssetProps {
    url: string;
    animation?: {
        current: string | null;
        playing: boolean;
        speed: number;
    };
}

export function RiggedAsset({ url, animation }: RiggedAssetProps) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(url);
    const { actions, names } = useAnimations(animations, group);

    useEffect(() => {
        if (animation?.current && actions[animation.current]) {
            // Stop all other animations
            Object.values(actions).forEach(action => action?.stop());

            // Play requested animation
            const action = actions[animation.current];
            if (action) {
                action.reset().fadeIn(0.5).play();
                action.timeScale = animation.speed;
            }
        } else {
            // If no current animation or invalid name, maybe play idle if exists?
            // For now, just stop everything if current is null
            if (!animation?.current) {
                Object.values(actions).forEach(action => action?.stop());
            }
        }
    }, [animation?.current, actions, animation?.speed]);

    useEffect(() => {
        if (animation?.current && actions[animation.current]) {
            const action = actions[animation.current];
            if (action) {
                action.paused = !animation.playing;
            }
        }
    }, [animation?.playing, animation?.current, actions]);

    return (
        <group ref={group} dispose={null}>
            <primitive object={scene} />
        </group>
    );
}

useGLTF.preload = (url: string) => useGLTF.preload(url);
