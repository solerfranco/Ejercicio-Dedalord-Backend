const express = require('express');
const { v4: uuidv4 } = require('uuid');

const conversations = [];
const users = [];

const getConversations = (req, res) => {
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
};

const createConversation = (req, res, io) => {
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
};

module.exports = {
  getConversations,
  createConversation,
};
