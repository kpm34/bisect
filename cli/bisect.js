#!/usr/bin/env node

const WebSocket = require('ws');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
    .name('bisect')
    .description('CLI for Bisect 3D Editor - The Cursor of Creative Work')
    .version('2.0.0');

// --- WebSocket Connection ---
const BRIDGE_URL = 'ws://localhost:8080';
let ws = null;
let pendingRequests = new Map();
let requestId = 0;

function connect() {
    return new Promise((resolve, reject) => {
        ws = new WebSocket(BRIDGE_URL);

        ws.on('open', () => {
            ws.send(JSON.stringify({ type: 'REGISTER_CLI' }));
            resolve(ws);
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'RESPONSE' && msg.id) {
                    const pending = pendingRequests.get(msg.id);
                    if (pending) {
                        pendingRequests.delete(msg.id);
                        if (msg.success) {
                            pending.resolve(msg.data);
                        } else {
                            pending.reject(new Error(msg.error || 'Request failed'));
                        }
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        ws.on('error', (err) => {
            reject(new Error('Failed to connect to bridge server. Is it running? (node cli/server.js)'));
        });
    });
}

function sendCommand(command) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                await connect();
            }
            ws.send(JSON.stringify({ type: 'CLI_COMMAND', command }));
            setTimeout(() => {
                resolve();
            }, 100);
        } catch (err) {
            reject(err);
        }
    });
}

function sendRequest(operation, payload = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                await connect();
            }

            const id = `cli_${++requestId}_${Date.now()}`;
            const request = {
                type: 'REQUEST',
                id,
                operation,
                payload,
                source: 'cli',
                target: 'editor',
                timestamp: Date.now()
            };

            const timeout = setTimeout(() => {
                pendingRequests.delete(id);
                reject(new Error('Request timed out'));
            }, 30000);

            pendingRequests.set(id, {
                resolve: (data) => {
                    clearTimeout(timeout);
                    resolve(data);
                },
                reject: (err) => {
                    clearTimeout(timeout);
                    reject(err);
                }
            });

            ws.send(JSON.stringify(request));
        } catch (err) {
            reject(err);
        }
    });
}

// ============================================
// Object Commands
// ============================================

program
    .command('add <type>')
    .description('Add a primitive object (box, sphere, plane, cylinder, cone, torus, text)')
    .option('-p, --position <x,y,z>', 'Position (default: 0,0,0)')
    .option('-s, --scale <x,y,z>', 'Scale (default: 1,1,1)')
    .option('-c, --color <hex>', 'Color (default: #3498db)')
    .option('-n, --name <name>', 'Object name')
    .action(async (type, options) => {
        const validTypes = ['box', 'sphere', 'plane', 'cylinder', 'cone', 'torus', 'text'];
        if (!validTypes.includes(type)) {
            console.error(`Invalid type. Use: ${validTypes.join(', ')}`);
            process.exit(1);
        }

        const payload = { type };
        if (options.position) {
            const [x, y, z] = options.position.split(',').map(Number);
            payload.position = { x, y, z };
        }
        if (options.scale) {
            const [x, y, z] = options.scale.split(',').map(Number);
            payload.scale = { x, y, z };
        }
        if (options.color) payload.color = options.color;
        if (options.name) payload.name = options.name;

        console.log(`Adding ${type}...`);
        await sendCommand({ type: 'ADD_OBJECT', payload });
        console.log(`Added ${type}`);
        process.exit(0);
    });

program
    .command('select <name>')
    .description('Select an object by name')
    .action(async (name) => {
        console.log(`Selecting "${name}"...`);
        await sendCommand({ type: 'SELECT_OBJECT', payload: { name } });
        console.log(`Selected "${name}"`);
        process.exit(0);
    });

program
    .command('delete [name]')
    .description('Delete selected object or by name')
    .action(async (name) => {
        console.log(`Deleting ${name || 'selected object'}...`);
        await sendCommand({ type: 'DELETE_OBJECT', payload: { name } });
        console.log('Deleted');
        process.exit(0);
    });

// ============================================
// Transform Commands
// ============================================

program
    .command('move <x,y,z>')
    .description('Move selected object to position')
    .option('-r, --relative', 'Move relative to current position')
    .action(async (pos, options) => {
        const [x, y, z] = pos.split(',').map(Number);
        console.log(`Moving to [${x}, ${y}, ${z}]${options.relative ? ' (relative)' : ''}...`);
        await sendCommand({
            type: 'UPDATE_OBJECT',
            payload: {
                position: { x, y, z },
                relative: options.relative || false
            }
        });
        console.log('Moved');
        process.exit(0);
    });

program
    .command('rotate <x,y,z>')
    .description('Rotate selected object (degrees)')
    .action(async (rot) => {
        const [x, y, z] = rot.split(',').map(Number);
        console.log(`Rotating by [${x}, ${y}, ${z}]...`);
        await sendCommand({
            type: 'UPDATE_OBJECT',
            payload: { rotation: { x: x * Math.PI / 180, y: y * Math.PI / 180, z: z * Math.PI / 180 } }
        });
        console.log('Rotated');
        process.exit(0);
    });

program
    .command('scale <x,y,z>')
    .description('Scale selected object')
    .action(async (scl) => {
        const [x, y, z] = scl.split(',').map(Number);
        console.log(`Scaling to [${x}, ${y}, ${z}]...`);
        await sendCommand({
            type: 'UPDATE_OBJECT',
            payload: { scale: { x, y, z } }
        });
        console.log('Scaled');
        process.exit(0);
    });

// ============================================
// Appearance Commands
// ============================================

program
    .command('color <hex>')
    .description('Set color of selected object')
    .action(async (hex) => {
        console.log(`Setting color to ${hex}...`);
        await sendCommand({ type: 'UPDATE_OBJECT', payload: { color: hex } });
        console.log('Color set');
        process.exit(0);
    });

program
    .command('material <preset>')
    .description('Apply material preset to selected object')
    .option('-c, --category <cat>', 'Material category (metal, wood, stone, fabric, plastic)')
    .action(async (preset, options) => {
        console.log(`Applying material "${preset}"...`);
        await sendCommand({
            type: 'SET_MATERIAL',
            payload: { preset, category: options.category }
        });
        console.log('Material applied');
        process.exit(0);
    });

program
    .command('opacity <value>')
    .description('Set opacity (0-1)')
    .action(async (value) => {
        const opacity = parseFloat(value);
        console.log(`Setting opacity to ${opacity}...`);
        await sendCommand({ type: 'UPDATE_OBJECT', payload: { opacity } });
        console.log('Opacity set');
        process.exit(0);
    });

// ============================================
// Event Commands
// ============================================

program
    .command('event <trigger> <action>')
    .description('Add event to selected object')
    .option('-t, --target <name>', 'Target object for action')
    .option('-v, --value <val>', 'Action value')
    .action(async (trigger, action, options) => {
        const validTriggers = ['click', 'hover', 'start', 'collision', 'mouseEnter', 'mouseLeave', 'doubleClick', 'drag', 'drop'];
        const validActions = ['scale', 'color', 'move', 'rotate', 'destroy', 'show', 'hide', 'toggle', 'playAnimation', 'stopAnimation', 'emit'];

        if (!validTriggers.includes(trigger)) {
            console.error(`Invalid trigger. Use: ${validTriggers.join(', ')}`);
            process.exit(1);
        }
        if (!validActions.includes(action)) {
            console.error(`Invalid action. Use: ${validActions.join(', ')}`);
            process.exit(1);
        }

        console.log(`Adding event: ${trigger} -> ${action}...`);
        await sendCommand({
            type: 'ADD_EVENT',
            payload: { trigger, action, target: options.target, value: options.value }
        });
        console.log('Event added');
        process.exit(0);
    });

// ============================================
// Animation Commands
// ============================================

program
    .command('animate <name>')
    .description('Play animation on selected object')
    .option('-s, --speed <speed>', 'Playback speed (default: 1)')
    .option('-l, --loop', 'Loop animation')
    .action(async (name, options) => {
        console.log(`Playing animation "${name}"...`);
        await sendCommand({
            type: 'PLAY_ANIMATION',
            payload: {
                name,
                speed: parseFloat(options.speed) || 1,
                loop: options.loop || false
            }
        });
        console.log('Animation started');
        process.exit(0);
    });

program
    .command('stop-animation')
    .description('Stop current animation')
    .action(async () => {
        console.log('Stopping animation...');
        await sendCommand({ type: 'STOP_ANIMATION', payload: {} });
        console.log('Animation stopped');
        process.exit(0);
    });

// ============================================
// Cloner Commands
// ============================================

program
    .command('clone')
    .description('Create cloner for selected object')
    .option('-m, --mode <mode>', 'Cloner mode (linear, radial, grid, scatter, spline, object)')
    .option('-c, --count <n>', 'Number of clones')
    .option('-s, --spacing <x,y,z>', 'Spacing between clones')
    .action(async (options) => {
        const mode = options.mode || 'linear';
        const count = parseInt(options.count) || 5;

        console.log(`Creating ${mode} cloner with ${count} copies...`);

        const payload = { mode, count };
        if (options.spacing) {
            const [x, y, z] = options.spacing.split(',').map(Number);
            payload.spacing = { x, y, z };
        }

        await sendCommand({ type: 'CREATE_CLONER', payload });
        console.log('Cloner created');
        process.exit(0);
    });

// ============================================
// Scene Commands
// ============================================

program
    .command('scene')
    .description('Get scene information')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        try {
            console.log('Getting scene info...');
            const data = await sendRequest('GET_SCENE_GRAPH', {});
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.log(`\nScene Analysis:`);
                console.log(`  Objects: ${data.nodes?.length || 0}`);
                console.log(`  Relationships: ${data.edges?.length || 0}`);
                console.log(`\nSummary: ${data.summary || 'No summary available'}`);
                if (data.nodes && data.nodes.length > 0) {
                    console.log(`\nObjects:`);
                    data.nodes.forEach(n => {
                        console.log(`  - ${n.name} (${n.type})`);
                    });
                }
            }
        } catch (err) {
            console.error('Error:', err.message);
        }
        process.exit(0);
    });

program
    .command('screenshot [output]')
    .description('Capture viewport screenshot')
    .action(async (output) => {
        try {
            console.log('Capturing screenshot...');
            const data = await sendRequest('GET_SCREENSHOT', {});
            if (output) {
                const buffer = Buffer.from(data.base64, 'base64');
                fs.writeFileSync(output, buffer);
                console.log(`Screenshot saved to ${output}`);
            } else {
                console.log(`Screenshot captured: ${data.width}x${data.height}`);
                console.log('Use --output <file> to save');
            }
        } catch (err) {
            console.error('Error:', err.message);
        }
        process.exit(0);
    });

program
    .command('save <file>')
    .description('Save scene to file')
    .action(async (file) => {
        console.log(`Saving scene to ${file}...`);
        await sendCommand({ type: 'SAVE_SCENE', payload: { path: file } });
        console.log('Scene saved');
        process.exit(0);
    });

program
    .command('load <file>')
    .description('Load scene from file')
    .action(async (file) => {
        console.log(`Loading scene from ${file}...`);
        await sendCommand({ type: 'LOAD_SCENE', payload: { path: file } });
        console.log('Scene loaded');
        process.exit(0);
    });

// ============================================
// AI Commands
// ============================================

program
    .command('ai <instruction>')
    .description('AI-powered scene editing (natural language)')
    .option('-v, --vision', 'Use vision (analyze current viewport)')
    .option('-d, --debate', 'Use multi-model debate for complex commands')
    .action(async (instruction, options) => {
        try {
            console.log(`AI processing: "${instruction}"...`);
            const data = await sendRequest('SMART_EDIT', {
                command: instruction,
                useVision: options.vision || false,
                useDebate: options.debate || instruction.length > 50
            });
            console.log('\nAI Response:');
            console.log(`  Approach: ${data.plan?.approach || 'N/A'}`);
            console.log(`  Reasoning: ${data.plan?.reasoning || 'N/A'}`);
            if (data.plan?.commands) {
                console.log(`  Commands: ${data.plan.commands.length}`);
            }
        } catch (err) {
            console.error('Error:', err.message);
        }
        process.exit(0);
    });

program
    .command('arrange <pattern>')
    .description('Arrange selected objects (grid, circle, spiral, scatter)')
    .option('-c, --count <n>', 'Number of items')
    .option('-r, --radius <r>', 'Radius for circular arrangements')
    .option('-s, --spacing <s>', 'Spacing between items')
    .action(async (pattern, options) => {
        console.log(`Arranging in ${pattern} pattern...`);
        await sendCommand({
            type: 'ARRANGE_OBJECTS',
            payload: {
                pattern,
                count: parseInt(options.count) || 8,
                radius: parseFloat(options.radius) || 5,
                spacing: parseFloat(options.spacing) || 1
            }
        });
        console.log('Objects arranged');
        process.exit(0);
    });

// ============================================
// Import/Export Commands
// ============================================

program
    .command('import <file>')
    .description('Import 3D asset (GLB, GLTF, OBJ, FBX)')
    .option('-p, --position <x,y,z>', 'Import position')
    .action(async (file, options) => {
        const format = path.extname(file).slice(1).toLowerCase();
        console.log(`Importing ${file} (${format})...`);

        const payload = { url: file, format };
        if (options.position) {
            const [x, y, z] = options.position.split(',').map(Number);
            payload.position = { x, y, z };
        }

        await sendCommand({ type: 'IMPORT_ASSET', payload });
        console.log('Asset imported');
        process.exit(0);
    });

program
    .command('export <file>')
    .description('Export scene to file (GLB, GLTF, React, Three.js)')
    .option('-f, --format <format>', 'Export format')
    .action(async (file, options) => {
        const format = options.format || path.extname(file).slice(1).toLowerCase() || 'glb';
        console.log(`Exporting scene as ${format}...`);
        await sendCommand({ type: 'EXPORT_SCENE', payload: { path: file, format } });
        console.log(`Scene exported to ${file}`);
        process.exit(0);
    });

// ============================================
// Script Commands
// ============================================

program
    .command('run <file>')
    .description('Run a script file (.bisect or .json)')
    .action(async (file) => {
        try {
            const content = fs.readFileSync(path.resolve(file), 'utf-8');
            const ext = path.extname(file).toLowerCase();

            let commands;

            if (ext === '.bisect') {
                // Parse .bisect format (line-based commands)
                commands = parseBisectScript(content);
            } else {
                // JSON format
                commands = JSON.parse(content);
            }

            if (!Array.isArray(commands)) {
                console.error('Script must be an array of commands');
                process.exit(1);
            }

            console.log(`Running script: ${file} (${commands.length} commands)...`);

            for (const cmd of commands) {
                console.log(`  Executing: ${cmd.command} ${JSON.stringify(cmd.args || {})}`);

                const messageType = mapCommandToType(cmd.command);
                if (messageType) {
                    await sendCommand({ type: messageType, payload: cmd.args || {} });
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            console.log('Script completed');
            process.exit(0);

        } catch (e) {
            console.error('Failed to run script:', e.message);
            process.exit(1);
        }
    });

// ============================================
// Configurator Commands
// ============================================

program
    .command('config')
    .description('Product configurator operations')
    .option('-p, --price <product>', 'Calculate price for product')
    .option('-s, --selections <json>', 'Configuration selections (JSON)')
    .action(async (options) => {
        if (options.price) {
            console.log(`Calculating price for ${options.price}...`);
            const selections = options.selections ? JSON.parse(options.selections) : {};

            // Call configurator API
            const response = await fetch('http://localhost:3000/api/configurator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculate_price',
                    productId: options.price,
                    selections
                })
            });

            const data = await response.json();
            console.log(`Price: $${data.price || 'N/A'}`);
            if (data.breakdown) {
                console.log('Breakdown:', JSON.stringify(data.breakdown, null, 2));
            }
        }
        process.exit(0);
    });

// ============================================
// Utility Commands
// ============================================

program
    .command('status')
    .description('Check connection status')
    .action(async () => {
        try {
            await connect();
            console.log('Connected to Bisect Bridge Server');
            console.log(`Bridge URL: ${BRIDGE_URL}`);
        } catch (err) {
            console.error('Not connected:', err.message);
        }
        process.exit(0);
    });

program
    .command('list-materials')
    .description('List available material presets')
    .option('-c, --category <cat>', 'Filter by category')
    .action(async (options) => {
        try {
            const response = await fetch('http://localhost:3000/api/materials/list' +
                (options.category ? `?category=${options.category}` : ''));
            const data = await response.json();
            console.log('Available Materials:');
            if (data.categories) {
                Object.entries(data.categories).forEach(([cat, materials]) => {
                    console.log(`\n${cat}:`);
                    materials.forEach(m => console.log(`  - ${m}`));
                });
            }
        } catch (err) {
            console.log('Could not fetch materials. Is the server running?');
        }
        process.exit(0);
    });

// ============================================
// Helper Functions
// ============================================

function parseBisectScript(content) {
    const commands = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const parts = trimmed.split(/\s+/);
        const command = parts[0];
        const args = {};

        // Parse command arguments
        switch (command) {
            case 'add':
                args.type = parts[1];
                break;
            case 'color':
                args.color = parts[1];
                break;
            case 'move':
            case 'position':
                const [x, y, z] = (parts[1] || '0,0,0').split(',').map(Number);
                args.position = { x, y, z };
                break;
            case 'rotate':
                const [rx, ry, rz] = (parts[1] || '0,0,0').split(',').map(Number);
                args.rotation = { x: rx, y: ry, z: rz };
                break;
            case 'scale':
                const [sx, sy, sz] = (parts[1] || '1,1,1').split(',').map(Number);
                args.scale = { x: sx, y: sy, z: sz };
                break;
            case 'event':
                args.trigger = parts[1];
                args.action = parts[2];
                break;
            case 'animate':
                args.name = parts[1];
                args.speed = parseFloat(parts[2]) || 1;
                break;
            case 'material':
                args.preset = parts[1];
                break;
            case 'select':
                args.name = parts[1];
                break;
            case 'import':
                args.url = parts[1];
                args.format = parts[2] || path.extname(parts[1]).slice(1);
                break;
            default:
                // Pass raw args
                args.raw = parts.slice(1);
        }

        commands.push({ command, args });
    }

    return commands;
}

function mapCommandToType(command) {
    const mapping = {
        'add': 'ADD_OBJECT',
        'color': 'UPDATE_OBJECT',
        'move': 'UPDATE_OBJECT',
        'position': 'UPDATE_OBJECT',
        'rotate': 'UPDATE_OBJECT',
        'scale': 'UPDATE_OBJECT',
        'event': 'ADD_EVENT',
        'animate': 'PLAY_ANIMATION',
        'material': 'SET_MATERIAL',
        'select': 'SELECT_OBJECT',
        'delete': 'DELETE_OBJECT',
        'import': 'IMPORT_ASSET',
        'export': 'EXPORT_SCENE',
        'clone': 'CREATE_CLONER',
        'arrange': 'ARRANGE_OBJECTS'
    };
    return mapping[command];
}

program.parse();
