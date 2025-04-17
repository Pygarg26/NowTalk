const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

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
