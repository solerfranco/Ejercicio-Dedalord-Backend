const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const authenticationRoutes = require('./routes/authenticationRoutes');
const conversationRoutes = require('./routes/conversationRoutes').default;
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const socketEvents = require('./sockets/socketEvents');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authenticationRoutes);
app.use('/conversation', conversationRoutes);
app.use('/message', messageRoutes);
app.use('/user', userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

socketEvents(io);

server.listen(5000, () => {
  console.log('Server listening on port 5000');
});
