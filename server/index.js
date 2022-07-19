const http = require('http');
const express = require('express');
const socketio = require('socket.io');


const { addUser, removeUser, getUser, getUsersInRoom ,getUserWithName } = require('./users');

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server,{
    cors:{
        origin:"*"
    },
    credentials: true
});


app.use(router);

io.on('connect', (socket) => {
    let username;
  socket.on('join', ({ name, room }, callback) => {
    console.log(name,room);
    username=name
    console.log("user info")
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();

  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    console.log("inside sendMessage box", user);

    io.to(user.room).emit('message', { user: user.name, text: message });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));