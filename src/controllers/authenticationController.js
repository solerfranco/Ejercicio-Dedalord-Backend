const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;

const users = [];

const login = async (req, res) => {
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
};

const validateToken = (req, res) => {
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
};

module.exports = {
  login,
  register,
  validateToken,
};
