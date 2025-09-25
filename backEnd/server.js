import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "https://chat-app-henna-sigma.vercel.app", ["https://chat-nn7j2ztwe-kainnikhils-projects.vercel.app/"]],
  methods: ["GET", "POST"],}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173" , "https://chat-app-henna-sigma.vercel.app"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join event
  socket.on("join", ({ username, room }) => {
    socket.username = username;  
    socket.room = room;  
    socket.join(room);
    io.to(room).emit("receiveMessage", {
      user: "System",
      text: `${username} joined the chat`,
    });
  });

  // Send message
  socket.on("sendMessage", ({ user, room, text }) => {
    socket.broadcast.to(room).emit("receiveMessage", { user, text });
  });

  // Typing
  socket.on("typing", ({ room, username }) => {
    socket.to(room).emit("userTyping", username);
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (socket.username && socket.room) {
      io.to(socket.room).emit("receiveMessage", {
        user: "System",
        text: `${socket.username} has left the chat`,
      });
      io.to(socket.room).emit("user-left", socket.username);
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
