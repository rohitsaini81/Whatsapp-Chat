const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const Server = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('disconnect', () => {console.log('user disconnected');});

  socket.on('chat-message', (msg) => {
    console.log( msg.name +' : ', msg.meassage);
    socket.broadcast.emit('chat', msg);
  });
});
const PORT=3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('listening on http://127.0.0.1:3000');
});
