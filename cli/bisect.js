#!/usr/bin/env node

const WebSocket = require('ws');
const { Command } = require('commander');
const program = new Command();

program
    .name('bisect')
    .description('CLI for Bisect 3D Editor')
    .version('1.0.0');

function sendCommand(command) {
    const ws = new WebSocket('ws://localhost:8080');

    ws.on('open', function open() {
        ws.send(JSON.stringify({ type: 'CLI_COMMAND', command }));
        // Wait briefly for server to relay, then exit. 
        // In a real app, we might wait for an ACK from the editor.
        setTimeout(() => {
            ws.close();
            process.exit(0);
        }, 100);
    });

    ws.on('error', (err) => {
        console.error('Failed to connect to bridge server. Is it running? (node cli/server.js)');
        process.exit(1);
    });
}

program
    .command('add <type>')
    .description('Add an object (box, sphere, plane)')
    .action((type) => {
        if (!['box', 'sphere', 'plane'].includes(type)) {
            console.error('Invalid type. Use: box, sphere, plane');
            return;
        }
        console.log(`Adding ${type}...`);
        sendCommand({ type: 'ADD_OBJECT', payload: { type } });
    });

program
    .command('color <hex>')
    .description('Set color of selected object')
    .action((hex) => {
        console.log(`Setting color to ${hex}...`);
        sendCommand({ type: 'UPDATE_OBJECT', payload: { color: hex } });
    });

program
    .command('event <trigger> <action>')
    .description('Add event to selected object')
    .action((trigger, action) => {
        console.log(`Adding event: ${trigger} -> ${action}...`);
        sendCommand({ type: 'ADD_EVENT', payload: { trigger, action } });
    });

program
    .command('animate <name> [speed]')
    .description('Play animation on selected object')
    .action((name, speed) => {
        console.log(`Playing animation: ${name} at speed ${speed || 1}...`);
        sendCommand({ type: 'PLAY_ANIMATION', payload: { name, speed: parseFloat(speed) || 1 } });
    });

program
    .command('run <file>')
    .description('Run a script file containing commands')
    .action((file) => {
        const fs = require('fs');
        const path = require('path');

        try {
            const scriptContent = fs.readFileSync(path.resolve(file), 'utf-8');
            const commands = JSON.parse(scriptContent);

            if (!Array.isArray(commands)) {
                console.error('Script must be a JSON array of commands');
                return;
            }

            console.log(`Running script: ${file} (${commands.length} commands)...`);

            const ws = new WebSocket('ws://localhost:8080');

            ws.on('open', async function open() {
                for (const cmd of commands) {
                    console.log(`Executing: ${cmd.command} ${JSON.stringify(cmd.args)}`);

                    // Map script command to internal message type
                    let messageType = '';
                    let payload = {};

                    switch (cmd.command) {
                        case 'add':
                            messageType = 'ADD_OBJECT';
                            payload = { type: cmd.args.type };
                            break;
                        case 'color':
                            messageType = 'UPDATE_OBJECT';
                            payload = { color: cmd.args.color };
                            break;
                        case 'event':
                            messageType = 'ADD_EVENT';
                            payload = { trigger: cmd.args.trigger, action: cmd.args.action };
                            break;
                        case 'import_asset':
                            messageType = 'IMPORT_ASSET';
                            payload = { url: cmd.args.url, format: cmd.args.format };
                            break;
                        case 'apply_modifier':
                            messageType = 'APPLY_MODIFIER';
                            payload = { type: cmd.args.type, value: cmd.args.value };
                            break;
                        case 'animate':
                            messageType = 'PLAY_ANIMATION';
                            payload = { name: cmd.args.name, speed: cmd.args.speed };
                            break;
                    }

                    if (messageType) {
                        ws.send(JSON.stringify({ type: 'CLI_COMMAND', command: { type: messageType, payload } }));
                        // Small delay to ensure order
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }

                console.log('Script completed.');
                ws.close();
                process.exit(0);
            });

            ws.on('error', (err) => {
                console.error('Failed to connect to bridge server.');
                process.exit(1);
            });

        } catch (e) {
            console.error('Failed to read or parse script file:', e.message);
        }
    });

program.parse();
