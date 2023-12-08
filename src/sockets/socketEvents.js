const { v4: uuidv4 } = require('uuid');

const socketEvents = (io) => {
  io.on('connection', (socket) => {
    socket.on("join", (roomId) => {
        socket.join(roomId);
    });

    socket.on("joinWithToken", (token) => {
        const userId = obtainUserId(token);
        socket.join(userId);
    });

    socket.on("message", (message) => {
        console.log(message);
        socket.to(message.conversationId).emit("message", message);
    });

    socket.on("conversation", (data) => {
        socket.to(data.userId).emit("conversation", data.conversation);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
  });
};

module.exports = socketEvents;
