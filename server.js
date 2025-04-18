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
let isOnline = [];

io.on('connection', (socket) => {
  //console.log('A user connected:', socket.id);

  socket.on('login', (username) => {
    // Save username to socket itself
    socket.username = username;
    onlineUsers[username] = socket.id;
    isOnline.push(username)

    io.emit('presence', { isOnline });
    console.log(isOnline)
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
      
      const index = isOnline.indexOf(username);
      if (index > -1) { // only splice array when item is found
          isOnline.splice(index, 1); // 2nd parameter means remove one item only
      }
      
      io.emit('presence', { isOnline });
      console.log(`${username} disconnected`);
    }
  });
});

app.get('/', (req, res) => {
  res.send('NowTalk Socket.IO server is running.');
});

// Check if a user is online
app.get('/is-online/:username', (req, res) => {
  const { username } = req.params;
  const isOnline = !!onlineUsers[username];
  res.json({ username, online: isOnline });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
