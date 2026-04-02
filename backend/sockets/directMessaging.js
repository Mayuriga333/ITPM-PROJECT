const mongoose = require('mongoose');

// userId -> Set(socketId)
const userSockets = new Map();

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function addSocketForUser(userId, socketId) {
  const key = String(userId);
  const existing = userSockets.get(key);
  if (existing) {
    existing.add(socketId);
  } else {
    userSockets.set(key, new Set([socketId]));
  }
}

function removeSocket(socketId) {
  for (const [userId, socketSet] of userSockets.entries()) {
    if (socketSet.has(socketId)) {
      socketSet.delete(socketId);
      if (socketSet.size === 0) userSockets.delete(userId);
      break;
    }
  }
}

function getSocketsForUser(userId) {
  return userSockets.get(String(userId)) || null;
}

module.exports = function registerDirectMessagingHandlers(io) {
  io.on('connection', (socket) => {
    // Client: socket.emit('addUser', userId)
    socket.on('addUser', (userId) => {
      const id = typeof userId === 'string' ? userId.trim() : '';
      if (!isValidObjectId(id)) return;

      socket.data.userId = id;
      addSocketForUser(id, socket.id);
    });

    // Client: socket.emit('sendMessage', { senderId, receiverId, text, conversationId? })
    // Server emits: 'receiveMessage' ONLY to receiver socket(s)
    socket.on('sendMessage', (payload, ack) => {
      try {
        const senderId = typeof payload?.senderId === 'string' ? payload.senderId.trim() : '';
        const receiverId = typeof payload?.receiverId === 'string' ? payload.receiverId.trim() : '';
        const text = normalizeText(payload?.text);
        const conversationId = typeof payload?.conversationId === 'string' ? payload.conversationId.trim() : undefined;

        if (!isValidObjectId(senderId) || !isValidObjectId(receiverId) || !text) {
          return typeof ack === 'function' ? ack({ ok: false, error: 'Invalid senderId, receiverId, or text' }) : undefined;
        }

        const receiverSockets = getSocketsForUser(receiverId);
        if (!receiverSockets || receiverSockets.size === 0) {
          return typeof ack === 'function' ? ack({ ok: true, delivered: 0 }) : undefined;
        }

        const message = {
          senderId,
          receiverId,
          text,
          conversationId,
          createdAt: new Date().toISOString(),
        };

        // Deliver to intended receiver only (no global broadcast)
        for (const receiverSocketId of receiverSockets) {
          io.to(receiverSocketId).emit('receiveMessage', message);
        }

        return typeof ack === 'function' ? ack({ ok: true, delivered: receiverSockets.size }) : undefined;
      } catch (err) {
        return typeof ack === 'function' ? ack({ ok: false, error: err?.message || 'sendMessage failed' }) : undefined;
      }
    });

    socket.on('disconnect', () => {
      removeSocket(socket.id);
    });
  });
};
