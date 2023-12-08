const express = require('express');
const { v4: uuidv4 } = require('uuid');

const messages = [];

const getMessages = (req, res) => {
    let filteredMessages = messages.filter(m => m.conversationId === req.query.conversationId);

    res.json({
        messages: filteredMessages,
    });
};

const sendMessage = (req, res) => {
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
};

module.exports = {
  getMessages,
  sendMessage,
};
