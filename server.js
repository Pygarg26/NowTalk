const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // You can set this to your frontend origin for more security
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

const onlineUsers = {}; // username => socket.id

io.on('connection', (socket) => {
  //console.log('A user connected:', socket.id);

  let username = null;

  socket.on('login', (user) => {
    username = user;
    onlineUsers[username] = socket.id;

    // Notify everyone that this user is online
    io.emit('presence', { username, online: true });
    console.log(`${username} is now online`);
  });

  socket.on('message', ({ to, text }) => {
    const recipientSocketId = onlineUsers[to];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message', {
        from: username,
        text
      });
    }
  });

  socket.on('disconnect', () => {
    if (username && onlineUsers[username]) {
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
