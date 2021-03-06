const express = require("express");
const http = require("http");
const { disconnect } = require("process");
const socketio = require("socket.io");

const { addUser, removeUser, getUser, getUserInRoom } = require("./users");

const PORT = process.env.PORT || 5000;

const router = require("./router");
const { use } = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
  console.log("new connection!!");

  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) {
      console.log(error);
      return;
    }

    socket.emit("message", {
      user: "Admin",
      text: `Hii!! ${user.name}, Welcome to ${user.room}`,
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "Admin",
      text: `${user.name} has joined the room`,
    });
    socket.join(user.room);
    callback();

    socket.on("sendMessage", (message, callback) => {
      const user = getUser(socket.id);
      io.to(user.room).emit("message", { user: user.name, text: message });
      callback();
    });
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "Admin",
        text: `${user.name} has left!!!`,
      });
    }
  });
});

app.use(router);

server.listen(PORT, () => console.log(`server running on port ${PORT}`));
