'use client';

import { useEffect } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';

export function CliBridge() {
    const { addObject, updateObject, selectedObject, addedObjects } = useSelection();

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
            console.log('✅ [CliBridge] Connected to CLI Bridge');
            ws.send(JSON.stringify({ type: 'REGISTER_EDITOR' }));
        };

        ws.onmessage = (event) => {
            try {
                const command = JSON.parse(event.data);
                console.log('📩 [CliBridge] Received command:', command);

                switch (command.type) {
                    case 'ADD_OBJECT':
                        console.log('➕ [CliBridge] Adding object:', command.payload.type);
                        addObject(command.payload.type);
                        break;
                    case 'UPDATE_OBJECT':
                        if (selectedObject && (selectedObject.userData as any).isAddedObject) {
                            const id = (selectedObject.userData as any).id;
                            updateObject(id, command.payload);
                        } else {
                            console.warn('No added object selected for update');
                        }
                        break;
                    case 'ADD_EVENT':
                        if (selectedObject && (selectedObject.userData as any).isAddedObject) {
                            const id = (selectedObject.userData as any).id;
                            const obj = addedObjects.find(o => o.id === id);
                            if (obj) {
                                const newEvent = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    trigger: command.payload.trigger,
                                    action: command.payload.action,
                                    parameters: {}
                                };
                                updateObject(id, { events: [...obj.events, newEvent] });
                            }
                        } else {
                            console.warn('No added object selected for event');
                        }
                        break;
                    case 'APPLY_MODIFIER':
                        if (selectedObject && (selectedObject.userData as any).isAddedObject) {
                            const id = (selectedObject.userData as any).id;
                            // For now, we simulate modifiers by changing properties or logging
                            console.log('Applying modifier:', command.payload);
                            if (command.payload.type === 'wireframe') {
                                // We can't easily set wireframe on the material without more state, 
                                // but we can toggle color to indicate change or use a specific color code
                                updateObject(id, { color: '#cccccc' }); // Grey for "processed"
                            } else if (command.payload.type === 'subdivide') {
                                // Simulate subdivision by scaling up slightly? Or just log.
                                // In a real app, we'd update the geometry args.
                                console.log('Subdividing mesh...');
                            }
                        }
                        break;
                    case 'IMPORT_ASSET':
                        console.log('Importing asset:', command.payload);
                        // Simulate import by adding a placeholder box
                        addObject('external', command.payload.url);
                        // We can't easily rename it immediately without the new ID, 
                        // but we can assume the last added object is the one.
                        break;
                    case 'PLAY_ANIMATION':
                        if (selectedObject && (selectedObject.userData as any).isAddedObject) {
                            const id = (selectedObject.userData as any).id;
                            updateObject(id, {
                                animation: {
                                    current: command.payload.name,
                                    playing: true,
                                    speed: command.payload.speed
                                }
                            });
                        }
                        break;
                    case 'SET_LOD':
                        if (selectedObject && (selectedObject.userData as any).isAddedObject) {
                            const id = (selectedObject.userData as any).id;
                            updateObject(id, {
                                lod: {
                                    enabled: true,
                                    levels: command.payload.levels
                                }
                            });
                        }
                        break;
                    case 'BAKE_MODEL':
                        console.log('Baking model with resolution:', command.payload.resolution);
                        // Simulate baking by changing color to "baked" texture color (e.g., orange)
                        if (selectedObject && (selectedObject.userData as any).isAddedObject) {
                            const id = (selectedObject.userData as any).id;
                            updateObject(id, { color: '#ffaa00' });
                        }
                        break;
                    case 'GENERATE_PARAMETRIC':
                        addObject('parametric', undefined, command.payload.formula);
                        break;
                    case 'GET_SCENE_TREE':
                        console.log('Scene Tree:', addedObjects);
                        // In a real app, we'd send this back via WS
                        break;
                }
            } catch (e) {
                console.error('Failed to process CLI command', e);
            }
        };

        // Expose test function for browser automation
        (window as any).runAdvancedTest = () => {
            console.log('🧪 [CliBridge] Running in-browser test...');

            // 1. Add Duck
            addObject('external', 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/duck/model.gltf');

            setTimeout(() => {
                // 2. Animate Duck
                if (addedObjects.length > 0) {
                    const id = addedObjects[addedObjects.length - 1].id;
                    updateObject(id, {
                        animation: { current: 'Walk', playing: true, speed: 1.5 }
                    });
                }
            }, 2000);

            setTimeout(() => {
                // 3. Bake (Color change)
                if (addedObjects.length > 0) {
                    const id = addedObjects[addedObjects.length - 1].id;
                    updateObject(id, { color: '#ffaa00' });
                }
            }, 4000);

            setTimeout(() => {
                // 4. Parametric Surface
                addObject('parametric', undefined, {
                    x: "u * 10 - 5",
                    y: "Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 2) * 2",
                    z: "v * 10 - 5",
                    uRange: [0, 1],
                    vRange: [0, 1]
                });
            }, 6000);
        };

        return () => {
            ws.close();
            delete (window as any).runAdvancedTest;
        };
    }, [addObject, updateObject, selectedObject, addedObjects]);

    return null;
}
