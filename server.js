const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
const users = {}; // username -> ws

wss.on('connection', (ws) => {
  let username = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'login') {
      username = data.username;
      users[username] = ws;
      console.log(`${username} connected`);
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
  });

  ws.on('close', () => {
    delete users[username];
    broadcastPresence(username, false);
    console.log(`${username} disconnected`);
  });
});

function broadcastPresence(user, isOnline) {
  Object.values(users).forEach(ws => {
    ws.send(JSON.stringify({
      type: 'presence',
      username: user,
      online: isOnline
    }));
  });
}

console.log("WebSocket server running on ws://localhost:3000");
