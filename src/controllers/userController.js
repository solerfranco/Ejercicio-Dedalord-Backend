import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sign } from 'jsonwebtoken';
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;

const users = [];

const getUsers = (req, res) => {
    res.json({
        users: users,
    });
};

const createUser = async (req, res) => {
    const { username, password } = req.body;

    const usernamePattern = /^[a-zA-Z0-9]+$/;
    if (!usernamePattern.test(username)) {
        return res.status(400).json({ message: 'Invalid username' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Invalid password' });
    }

    const hashedPassword = await hash(password, 10);
    const newUser = {
        id: uuidv4(),
        lastMessage: null,
        username: username,
        password: hashedPassword,
    };

    users.push(newUser);

    const token = sign({ userId: newUser.id, username: newUser.username }, secretKey, { expiresIn: '7d' });

    res.json({ message: 'User added successfully', token });
};

export default {
  getUsers,
  createUser,
};
