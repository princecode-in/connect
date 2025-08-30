const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
// REMOVED: socket = io({ transports: ["websocket"] }); // This line was causing the error

let waitingQueue = [];       // queue of waiting user IDs
const partners = new Map();  // store pairs (socket.id → partner.id)

// socket.io
io.on("connection", (socket) => {
  // when a user sets their username and wants to join
  socket.on("set-username", (username) => {
    socket.username = username;

    if (waitingQueue.length === 0) {
      // nobody waiting → put this user into queue
      waitingQueue.push(socket.id);
      socket.emit("usermsg", "⚠️ Waiting for a partner to connect...");
    } else {
      // someone is waiting → take them from queue
      const partnerId = waitingQueue.shift();
      const partner = io.sockets.sockets.get(partnerId);

      if (partner) {
        // create pair mapping
        partners.set(socket.id, partner.id);
        partners.set(partner.id, socket.id);

        // notify both
        partner.emit(
          "usermsg",
          `✅ Connected! You are now chatting with ${socket.username}`
        );
        socket.emit(
          "usermsg",
          `✅ Connected! You are now chatting with ${partner.username}`
        );
      } else {
        // partner disconnected while waiting → add this user to queue
        waitingQueue.push(socket.id);
      }
    }
  });

  // when user sends a message
  socket.on("user-msg", (message) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("usermsg", {
        from: socket.username,
        text: message,
      });
    }
  });

  // when a user disconnects
  socket.on("disconnect", () => {
    const partnerId = partners.get(socket.id);

    if (partnerId) {
      // remove pair
      partners.delete(socket.id);
      partners.delete(partnerId);

      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit("usermsg", `❌ ${partnerSocket.username || "stranger"} disconnected.`);

        if (waitingQueue.length === 0) {
          // no one else waiting → put partner in queue
          waitingQueue.push(partnerId);
          partnerSocket.emit("usermsg", "⚠️ Waiting for a new partner...");
        } else {
          // someone else already waiting → pair immediately
          const nextId = waitingQueue.shift();
          const nextSocket = io.sockets.sockets.get(nextId);

          if (nextSocket) {
            partners.set(partnerId, nextSocket.id);
            partners.set(nextSocket.id, partnerId);

            partnerSocket.emit(
              "usermsg",
              `✅ Connected! You are now chatting with ${nextSocket.username}`
            );
            nextSocket.emit(
              "usermsg",
              `✅ Connected! You are now chatting with ${partnerSocket.username}`
            );
          } else {
            // if nextSocket disappeared, just requeue partner
            waitingQueue.push(partnerId);
          }
        }
      }
    }

    // remove disconnected user from queue if they were waiting
    waitingQueue = waitingQueue.filter((id) => id !== socket.id);
  });
});

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});