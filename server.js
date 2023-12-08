const express = require('express');
const app = express();
const http = require('http')
const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    }
});

// Middleware to parse JSON and url-encoded data

const secretKey = '$2b$10$tX2Xn8ihc3EiTXs8.IQvluPFRMN8VM823wcA4GsFKIBefb.FnHTNO';

let users = [
]

let conversations = [
]

let messages = [
]

// Middleware to validate the token
const validateToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Attach the decoded payload to the request object for further use
        req.user = decoded;

        next();
    });
};

app.get("/users", validateToken, (req, res) => {
    res.json({
        users: users,
    });
});

app.post("/user", async (req, res) => {
    const { username, password } = req.body;

    const usernamePattern = /^[a-zA-Z0-9]+$/;
    if (!usernamePattern.test(username)) {
        return res.status(400).json({ message: 'Invalid username' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Invalid password' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: uuidv4(),
        lastMessage: null,
        username: username,
        password: hashedPassword,
    };

    users.push(newUser);

    const token = jwt.sign({ userId: newUser.id, username: newUser.username }, secretKey, { expiresIn: '7d' }); // You can adjust the expiration time

    res.json({ message: 'User added successfully', token });
});

app.get("/conversation", validateToken, (req, res) => {
    let filteredConversations = conversations.filter(c => c.users.includes(req.user.userId));

    filteredConversations = filteredConversations.map(c => {
        const sender = c.users.find(u => u !== req.user.userId);
        const name = users.find(u => u.id === sender).username;
        return {
            id: c.id,
            contactId: sender,
            contactName: name,
            lastMessage: "",
        }
    });
    io.to(req.user.userId).emit("join", req.user.userId);

    res.json({
        conversations: filteredConversations,
    });
});

app.post("/conversation", validateToken, (req, res) => {
    const { username } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ message: 'Username not found' });

    const existingConversation = conversations.find(c => c.users.includes(req.user.userId) && c.users.includes(user.id));
    if (existingConversation) return res.status(400).json({ message: 'Conversation already exists' });

    const conversation = {
        id: uuidv4(),
        users: [req.user.userId, user.id],
    };

    conversations.push(conversation);

    io.to(user.id).emit("conversation", {
        id: conversation.id,
        contactId: req.user.userId,
        contactName: req.user.username,
        lastMessage: "",
    });

    res.json({
        conversation: {
            id: conversation.id,
            contactId: user.id,
            contactName: username,
            lastMessage: "",
        }
    });
});

app.get("/message", validateToken, (req, res) => {
    let filteredMessages = messages.filter(m => m.conversationId === req.query.conversationId);

    res.json({
        messages: filteredMessages,
    });
});

app.post("/message", validateToken, (req, res) => {
    const { conversationId, content } = req.body;

    const message = {
        id: uuidv4(),
        conversationId: conversationId,
        sender: req.user.userId,
        content: content,
        timeSent: new Date(),
    };

    const conversation = conversations.find(c => c.id === conversationId);
    conversation.lastMessage = content;

    messages.push(message);

    res.json({ message });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // Find the user by username
    const user = users.find(u => u.username === username);

    // If the user doesn't exist or the passwords don't match, return an error
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If the passwords match, generate a token
    const token = jwt.sign({ userId: user.id, username: user.username }, secretKey, { expiresIn: '1h' }); // You can adjust the expiration time

    // Return the token in the response
    res.json({ message: 'Login successful', token });
});

app.post('/validate-token', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Token is missing' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        if (!users.find(u => u.id === decoded.userId)) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.json({ message: 'Token is valid', decoded });
    });
});

const obtainUserId = (token) => {
    if (!token) {
        return null;
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return null;
        }

        return decoded;
    });
}

io.on("connection", (socket) => {

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

server.listen(5000, () => {
    console.log('Server listening on port 5000');
});