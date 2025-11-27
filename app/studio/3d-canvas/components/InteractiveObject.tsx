'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion-3d';
import { useSelection } from '../r3f/SceneSelectionContext';
import { RigidBody } from '@react-three/rapier';
import { Gltf, Detailed } from '@react-three/drei';
import { RiggedAsset } from './RiggedAsset';
import { ParametricObject } from './ParametricObject';
import * as THREE from 'three';

interface InteractiveObjectProps {
    obj: any;
    children: React.ReactNode;
}

export function InteractiveObject({ obj, children }: InteractiveObjectProps) {
    const { setSelectedObject, updateObject, removeObject } = useSelection();
    const [isHovered, setIsHovered] = useState(false);

    const events = obj.events || [];

    // Helper to execute action
    const executeAction = (action: string, params: any) => {
        switch (action) {
            case 'scale':
                // For now, we'll just toggle a scale state or use a ref?
                // Framer motion variants are declarative.
                // Let's use a simple approach: if action is scale, we set a state.
                // But we have multiple events.
                // For simplicity in this iteration, we'll handle 'scale' via hover/click states.
                break;
            case 'color':
                const newColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
                updateObject(obj.id, { color: newColor });
                break;
            case 'move':
                updateObject(obj.id, { position: [obj.position[0], obj.position[1] + 1, obj.position[2]] });
                break;
            case 'destroy':
                removeObject(obj.id);
                break;
        }
    };

    const handlePointerOver = (e: any) => {
        e.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';

        events.forEach((event: any) => {
            if (event.trigger === 'hover') {
                executeAction(event.action, event.parameters);
            }
        });
    };

    const handlePointerOut = (e: any) => {
        e.stopPropagation();
        setIsHovered(false);
        document.body.style.cursor = 'auto';
    };

    const handleClick = (e: any) => {
        e.stopPropagation();
        setSelectedObject(e.object);

        events.forEach((event: any) => {
            if (event.trigger === 'click') {
                executeAction(event.action, event.parameters);
            }
        });
    };

    // Calculate animation state based on events
    // This is a bit tricky with multiple events. 
    // We'll check if any 'hover' event has 'scale' action.
    const hoverScaleEvent = events.find((e: any) => e.trigger === 'hover' && e.action === 'scale');
    const clickScaleEvent = events.find((e: any) => e.trigger === 'click' && e.action === 'scale');

    const variants = {
        initial: { scale: 1 },
        hover: hoverScaleEvent ? { scale: 1.2 } : {},
        click: clickScaleEvent ? { scale: 0.9 } : {}, // Click usually scales down briefly
    };

    // If physics is enabled, we need to be careful with scaling as it might affect physics body.
    // RigidBody from rapier doesn't always like dynamic scaling of children.
    // But for simple effects, it might be fine.

    return (
        <RigidBody
            key={obj.id}
            type={obj.physics.enabled ? (obj.physics.type as any) : 'fixed'}
            colliders={obj.type === 'plane' ? 'hull' : 'cuboid'}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale} // Base scale
            mass={obj.physics.mass}
            restitution={obj.physics.restitution}
            friction={obj.physics.friction}
        >
            <motion.group
                initial="initial"
                animate={isHovered ? 'hover' : 'initial'}
                whileTap={clickScaleEvent ? 'click' : undefined}
                variants={variants}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
            >
                {obj.type === 'external' && obj.url ? (
                    obj.lod?.enabled && obj.lod.levels.length > 0 ? (
                        <Detailed distances={obj.lod.levels.map((l: any) => l.distance)}>
                            {obj.lod.levels.map((level: any, index: number) => (
                                <RiggedAsset key={index} url={level.url} animation={obj.animation} />
                            ))}
                        </Detailed>
                    ) : (
                        <RiggedAsset url={obj.url} animation={obj.animation} />
                    )
                ) : obj.type === 'parametric' && obj.formula ? (
                    <ParametricObject
                        formula={obj.formula}
                        uRange={obj.formula.uRange}
                        vRange={obj.formula.vRange}
                    />
                ) : (
                    children
                )}
            </motion.group>
        </RigidBody>
    );
}
