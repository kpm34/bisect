import React, { useMemo } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry';
import { extend, ReactThreeFiber } from '@react-three/fiber';

extend({ ParametricGeometry });

declare global {
    namespace JSX {
        interface IntrinsicElements {
            parametricGeometry: ReactThreeFiber.Object3DNode<ParametricGeometry, typeof ParametricGeometry>;
        }
    }
}

interface ParametricObjectProps {
    formula: { x: string; y: string; z: string };
    uRange: [number, number];
    vRange: [number, number];
}

export function ParametricObject({ formula, uRange, vRange }: ParametricObjectProps) {
    const mesh = useMemo(() => {
        const func = (u: number, v: number, target: THREE.Vector3) => {
            // Map u,v (0..1) to ranges
            const uVal = uRange[0] + u * (uRange[1] - uRange[0]);
            const vVal = vRange[0] + v * (vRange[1] - vRange[0]);

            // Safe evaluation
            try {
                // Create a function from the string formula
                // NOTE: Using Function constructor is risky with untrusted input, 
                // but for this local tool it's acceptable for flexibility.
                // We expose Math functions to the scope.
                const scope = { ...Math, u: uVal, v: vVal };
                const keys = Object.keys(scope);
                const values = Object.values(scope);

                const evalFormula = (f: string) => {
                    return new Function(...keys, `return ${f}`)(...values);
                };

                const x = evalFormula(formula.x);
                const y = evalFormula(formula.y);
                const z = evalFormula(formula.z);

                target.set(x, y, z);
            } catch (e) {
                console.error("Error evaluating parametric formula", e);
                target.set(0, 0, 0);
            }
        };
        return func;
    }, [formula, uRange, vRange]);

    return (
        <mesh>
            <parametricGeometry args={[mesh, 25, 25]} />
            <meshStandardMaterial color="#0088ff" side={THREE.DoubleSide} wireframe />
        </mesh>
    );
}
