# Minecraft Clone - Multiplayer Server Setup Guide

A WebSocket server for the Minecraft Clone game that enables real-time multiplayer gameplay.

## 📋 Prerequisites

Before setting up the server, you need to install:

1. **Node.js** (version 14 or higher)
   - Download from: https://nodejs.org/
   - Includes npm (Node Package Manager)

To check if you have Node.js installed:
```bash
node --version
npm --version
```

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

Open a terminal/command prompt in the folder containing the server files and run:

```bash
npm install
```

This will install the required `ws` (WebSocket) package.

### Step 2: Start the Server

```bash
npm start
```

You should see:
```
==================================================
Minecraft Clone WebSocket Server
==================================================
Server running on port 8080
WebSocket URL: ws://localhost:8080
Max players: 50
==================================================
Server started successfully!
Press Ctrl+C to stop the server
==================================================
```

### Step 3: Connect from Game

1. Open the Minecraft Clone game in your browser
2. Click **"Multiplayer"**
3. Click **"Join Server (WebSocket)"**
4. Enter: `ws://localhost:8080`
5. Click **"Connect to Server"**
6. Create your world and play!

## 🌐 Playing Over the Internet

### Option 1: Local Network (LAN)

**For playing with friends on the same WiFi:**

1. Find your local IP address:
   - **Windows**: Open CMD and type `ipconfig` (look for IPv4 Address)
   - **Mac/Linux**: Open Terminal and type `ifconfig` or `ip addr`

2. Start the server on your computer

3. Friends connect using: `ws://YOUR_IP:8080`
   - Example: `ws://192.168.1.100:8080`

4. **Important**: Make sure your firewall allows port 8080

### Option 2: Internet (Requires Port Forwarding)

**For playing with friends over the internet:**

1. Set up port forwarding on your router:
   - Forward port 8080 to your computer's local IP
   - (Google: "port forwarding [your router model]")

2. Find your public IP: Visit https://whatismyipaddress.com/

3. Friends connect using: `ws://YOUR_PUBLIC_IP:8080`

⚠️ **Security Warning**: Exposing ports to the internet has security risks. Consider using a VPS instead.

### Option 3: Cloud Hosting (Recommended for Internet Play)

**Popular hosting options:**

1. **Heroku** (Free tier available)
   - Deploy with Git
   - Use `wss://your-app.herokuapp.com`

2. **Railway** (Free tier available)
   - Easy deployment
   - Use `wss://your-app.railway.app`

3. **DigitalOcean/AWS/Google Cloud**
   - More control
   - Paid service

## 🔧 Configuration

### Change Port

Edit `minecraft-server.js`:
```javascript
const PORT = 3000; // Change from 8080 to 3000
```

Or set environment variable:
```bash
PORT=3000 npm start
```

### Change Max Players

Edit `minecraft-server.js`:
```javascript
const MAX_PLAYERS = 100; // Change from 50 to 100
```

## 📊 Server Features

✅ **Real-time player sync** - Updates 20 times per second
✅ **Block sync** - All block placements/breaks are synced
✅ **Auto-cleanup** - Removes inactive players after 5 minutes
✅ **Player limits** - Configurable max players
✅ **Logging** - All events are logged with timestamps
✅ **Graceful shutdown** - Properly closes all connections

## 🐛 Troubleshooting

### "Error: Cannot find module 'ws'"
**Solution**: Run `npm install`

### "Port 8080 is already in use"
**Solution**: 
- Close other programs using port 8080, OR
- Change the port in the server file

### "Connection refused" from game
**Solution**:
- Make sure server is running (check terminal)
- Check you're using the correct URL (ws:// not http://)
- For local: use `ws://localhost:8080`
- For LAN: use `ws://YOUR_LOCAL_IP:8080`

### Players can't connect over internet
**Solution**:
- Check port forwarding is set up correctly
- Make sure firewall allows port 8080
- Verify public IP address is correct
- Try using a cloud hosting service instead

### "EACCES: permission denied"
**Solution**: 
- On Linux/Mac, use a port above 1024 OR
- Run with sudo (not recommended)

## 📁 Server Files

- `minecraft-server.js` - Main server code
- `package.json` - Node.js dependencies and scripts
- `README.md` - This file

## 🔒 Security Notes

- The server has no authentication by default
- Anyone with the URL can join
- Consider adding password protection for public servers
- Use `wss://` (secure WebSocket) in production
- Don't expose to internet without proper security

## 💻 Advanced Usage

### Auto-restart on Changes (Development)

Install nodemon:
```bash
npm install --save-dev nodemon
```

Run with auto-restart:
```bash
npm run dev
```

### View Server Logs

All events are logged with timestamps:
- Player connections/disconnections
- Block placements/breaks
- Errors

### Deploy to Heroku

1. Create `Procfile`:
```
web: node minecraft-server.js
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

3. Use URL: `wss://your-app-name.herokuapp.com`

## 📞 Support

If you have issues:
1. Check the troubleshooting section above
2. Make sure Node.js is installed correctly
3. Verify all dependencies are installed (`npm install`)
4. Check server logs for error messages

## 🎮 Game Connection Format

**Local (same computer):**
```
ws://localhost:8080
```

**LAN (same WiFi):**
```
ws://192.168.1.XXX:8080
```

**Internet (with port forwarding):**
```
ws://YOUR_PUBLIC_IP:8080
```

**Cloud hosted:**
```
wss://your-server.com
```

Note: Use `wss://` (secure) for HTTPS websites, `ws://` for HTTP or localhost.

## 📝 License

MIT License - Feel free to modify and use!

---

**Have fun playing Minecraft Clone with your friends! 🎮🌍**
