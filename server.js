const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

const onlineUsers = {}; // username => socket.id

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('login', (username) => {
    // Save username to socket itself
    socket.username = username;
    onlineUsers[username] = socket.id;

    io.emit('presence', { username, online: true });
    console.log(`${username} is now online`);
  });

  socket.on('message', ({ to, text }) => {
    const from = socket.username;
    const recipientSocketId = onlineUsers[to];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message', {
        from,
        text
      });
    }
  });

  socket.on('disconnect', () => {
    const username = socket.username;
    if (username && onlineUsers[username] === socket.id) {
      delete onlineUsers[username];
      io.emit('presence', { username, online: false });
      console.log(`${username} disconnected`);
    }
  });
});

app.get('/', (req, res) => {
  res.send('NowTalk Socket.IO server is running.');
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
