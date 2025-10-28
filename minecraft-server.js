// Minecraft Clone - WebSocket Multiplayer Server
// Complete Node.js server for handling multiplayer connections

const WebSocket = require('ws');
const http = require('http');
const readline = require('readline');

// Configuration
const PORT = process.env.PORT || 8080;
const MAX_PLAYERS = 50; // Maximum players per server
const POSITION_UPDATE_RATE = 50; // ms between position broadcasts (20 updates/second)

// Server world seed - set on startup
let WORLD_SEED = null;

// Create readline interface for server input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask for seed on startup
function startServer() {
    rl.question('Enter world seed (or press Enter for random): ', (answer) => {
        if (answer.trim() === '') {
            WORLD_SEED = Math.floor(Math.random() * 1000000);
            console.log(`Generated random seed: ${WORLD_SEED}`);
        } else {
            // Try to parse as number, otherwise use as string
            const parsed = parseInt(answer.trim());
            WORLD_SEED = isNaN(parsed) ? answer.trim() : parsed;
            console.log(`Using seed: ${WORLD_SEED}`);
        }
        
        rl.close();
        initializeServer();
    });
}

function initializeServer() {
    // Create HTTP server
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Minecraft Clone WebSocket Server\nSeed: ${WORLD_SEED}\nPlayers: ${players.size}/${MAX_PLAYERS}\n`);
    });

    // Create WebSocket server
    const wss = new WebSocket.Server({ server });

    // Store connected players
    const players = new Map(); // playerId -> { ws, position, rotation, lastUpdate }
    let playerIdCounter = 0;

    // Generate unique player ID
    function generatePlayerId() {
        playerIdCounter++;
        return `player_${playerIdCounter}_${Date.now()}`;
    }

    // Broadcast message to all players except sender
    function broadcast(message, excludeWs = null) {
        const messageStr = JSON.stringify(message);
        
        wss.clients.forEach(client => {
            if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    // Broadcast to all players including sender
    function broadcastToAll(message) {
        const messageStr = JSON.stringify(message);
        
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    // Handle new connections
    wss.on('connection', (ws, req) => {
        const clientIp = req.socket.remoteAddress;
        console.log(`[${new Date().toISOString()}] New connection from ${clientIp}`);
        
        // Check if server is full
        if (players.size >= MAX_PLAYERS) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Server is full'
            }));
            ws.close();
            return;
        }
        
        // Generate player ID
        const playerId = generatePlayerId();
        
        // Store player data with rotation
        players.set(playerId, {
            ws: ws,
            position: { x: 0, y: 50, z: 0 },
            rotation: { x: 0, y: 0 },
            lastUpdate: Date.now(),
            ip: clientIp
        });
        
        // Send welcome message with player ID and world seed
        ws.send(JSON.stringify({
            type: 'welcome',
            playerId: playerId,
            seed: WORLD_SEED,
            playerCount: players.size
        }));
        
        console.log(`[${new Date().toISOString()}] Player ${playerId} joined (${players.size}/${MAX_PLAYERS} players)`);
        console.log(`[${new Date().toISOString()}] Sent world seed ${WORLD_SEED} to player ${playerId}`);
        
        // Notify all other players about new player
        broadcast({
            type: 'playerJoined',
            playerId: playerId,
            position: { x: 0, y: 50, z: 0 },
            rotation: { x: 0, y: 0 }
        }, ws);
        
        // Send existing players to new player
        players.forEach((playerData, pid) => {
            if (pid !== playerId) {
                ws.send(JSON.stringify({
                    type: 'playerJoined',
                    playerId: pid,
                    position: playerData.position,
                    rotation: playerData.rotation
                }));
            }
        });
        
        // Handle incoming messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                
                // Update player's last activity
                const playerData = players.get(playerId);
                if (playerData) {
                    playerData.lastUpdate = Date.now();
                }
                
                // Handle different message types
                switch(message.type) {
                    case 'playerMove':
                        // Update stored position and rotation
                        if (playerData) {
                            playerData.position = {
                                x: message.x,
                                y: message.y,
                                z: message.z
                            };
                            
                            // Update rotation if provided
                            if (message.rotY !== undefined) {
                                playerData.rotation = {
                                    x: message.rotX || 0,
                                    y: message.rotY
                                };
                            }
                        }
                        
                        // Broadcast position and rotation to other players
                        broadcast({
                            type: 'playerMove',
                            playerId: playerId,
                            x: message.x,
                            y: message.y,
                            z: message.z,
                            rotX: message.rotX || 0,
                            rotY: message.rotY || 0
                        }, ws);
                        break;
                        
                    case 'blockPlace':
                        console.log(`[${new Date().toISOString()}] Player ${playerId} placed ${message.blockType} at (${message.x}, ${message.y}, ${message.z})`);
                        
                        // Broadcast to all other players
                        broadcast({
                            type: 'blockPlace',
                            playerId: playerId,
                            x: message.x,
                            y: message.y,
                            z: message.z,
                            blockType: message.blockType
                        }, ws);
                        break;
                        
                    case 'blockBreak':
                        console.log(`[${new Date().toISOString()}] Player ${playerId} broke block at (${message.x}, ${message.y}, ${message.z})`);
                        
                        // Broadcast to all other players
                        broadcast({
                            type: 'blockBreak',
                            playerId: playerId,
                            x: message.x,
                            y: message.y,
                            z: message.z
                        }, ws);
                        break;
                        
                    default:
                        console.log(`[${new Date().toISOString()}] Unknown message type from ${playerId}: ${message.type}`);
                }
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error parsing message from ${playerId}:`, error);
            }
        });
        
        // Handle disconnection
        ws.on('close', () => {
            console.log(`[${new Date().toISOString()}] Player ${playerId} disconnected (${players.size - 1}/${MAX_PLAYERS} players)`);
            
            // Remove player
            players.delete(playerId);
            
            // Notify all other players
            broadcast({
                type: 'playerLeft',
                playerId: playerId
            });
        });
        
        // Handle errors
        ws.on('error', (error) => {
            console.error(`[${new Date().toISOString()}] WebSocket error for ${playerId}:`, error);
        });
    });

    // Cleanup inactive players (timeout after 5 minutes of inactivity)
    setInterval(() => {
        const now = Date.now();
        const TIMEOUT = 5 * 60 * 1000; // 5 minutes
        
        players.forEach((playerData, playerId) => {
            if (now - playerData.lastUpdate > TIMEOUT) {
                console.log(`[${new Date().toISOString()}] Removing inactive player ${playerId}`);
                playerData.ws.close();
                players.delete(playerId);
                
                broadcast({
                    type: 'playerLeft',
                    playerId: playerId
                });
            }
        });
    }, 60000); // Check every minute

    // Start server
    server.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('🎮 MINECRAFT CLONE - WEBSOCKET MULTIPLAYER SERVER 🎮');
        console.log('='.repeat(60));
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌐 WebSocket URL: ws://localhost:${PORT}`);
        console.log(`🌍 World Seed: ${WORLD_SEED}`);
        console.log(`👥 Max players: ${MAX_PLAYERS}`);
        console.log(`📡 Position update rate: ${POSITION_UPDATE_RATE}ms (${1000/POSITION_UPDATE_RATE} updates/sec)`);
        console.log('='.repeat(60));
        console.log('✨ Server started successfully!');
        console.log('🛑 Press Ctrl+C to stop the server');
        console.log('='.repeat(60));
        console.log('');
    });

    // Graceful shutdown
    function shutdown() {
        console.log(`\n[${new Date().toISOString()}] 🛑 Shutting down server...`);
        
        // Notify all players
        broadcastToAll({
            type: 'serverShutdown',
            message: 'Server is shutting down'
        });
        
        // Close all connections
        setTimeout(() => {
            wss.clients.forEach(client => {
                client.close();
            });
            
            server.close(() => {
                console.log('✅ Server shut down successfully');
                process.exit(0);
            });
        }, 1000);
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

// Start the server with seed prompt
console.log('');
console.log('='.repeat(60));
console.log('🎮 MINECRAFT CLONE SERVER SETUP 🎮');
console.log('='.repeat(60));
console.log('');
startServer();