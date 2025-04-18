const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// In-memory user registry
const users = {}; // username -> WebSocket

wss.on('connection', (ws) => {
  let username = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'login') {
        username = data.username;
        users[username] = ws;
        console.log(`${username} connected`);

        // Notify all users that this user is online
        broadcastPresence(username, true);
      }

      if (data.type === 'message') {
        const to = data.to;
        const recipient = users[to];
        if (recipient) {
          recipient.send(JSON.stringify({
            type: 'message',
            from: username,
            text: data.text
          }));
        }
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    if (username) {
      delete users[username];
      broadcastPresence(username, false);
      console.log(`${username} disconnected`);
    }
  });
});

// Broadcast user's online/offline presence
function broadcastPresence(user, isOnline) {
  const payload = JSON.stringify({
    type: 'presence',
    username: user,
    online: isOnline
  });

  Object.values(users).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Just to make Render happy—basic route
app.get('/', (req, res) => {
  res.send('NowTalk WebSocket server is running.');
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
