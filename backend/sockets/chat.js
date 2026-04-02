const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

function normalizeRoomId(roomId) {
    if (typeof roomId !== 'string') return null;
    const trimmed = roomId.trim();
    return trimmed.length ? trimmed : null;
}

function isValidObjectId(value) {
    return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

function toSafeUser(user) {
    if (!user || typeof user !== 'object') return null;
    const id = typeof user.id === 'string' ? user.id.trim() : '';
    const role = typeof user.role === 'string' ? user.role.trim() : '';
    if (!id || !isValidObjectId(id) || (role && !['student', 'volunteer'].includes(role))) return null;
    return { id, role };
}

module.exports = function registerChatHandlers(io) {
    io.on('connection', (socket) => {
        // Client should call: socket.emit('chat:join', { roomId, user }, (resp) => ...)
        socket.on('chat:join', async (payload, ack) => {
            try {
                const roomId = normalizeRoomId(payload?.roomId);
                const user = toSafeUser(payload?.user);

                if (!roomId || !user) {
                    return typeof ack === 'function'
                        ? ack({ ok: false, error: 'Invalid roomId or user' })
                        : undefined;
                }

                // Treat roomId as conversationId
                if (!isValidObjectId(roomId)) {
                    return typeof ack === 'function'
                        ? ack({ ok: false, error: 'Invalid conversationId' })
                        : undefined;
                }

                const conversation = await Conversation.findById(roomId).lean();
                if (!conversation) {
                    return typeof ack === 'function'
                        ? ack({ ok: false, error: 'Conversation not found' })
                        : undefined;
                }

                const members = Array.isArray(conversation.members)
                    ? conversation.members.map((m) => String(m))
                    : [];
                if (!members.includes(String(user.id))) {
                    return typeof ack === 'function'
                        ? ack({ ok: false, error: 'User is not a member of this conversation' })
                        : undefined;
                }

                socket.data.roomId = roomId;
                socket.data.user = user;

                await socket.join(roomId);

                // Send a small recent history to the joiner
                let recent = [];
                try {
                    recent = await Message.find({ conversationId: roomId })
                        .sort({ createdAt: -1 })
                        .limit(50)
                        .lean();
                    recent.reverse();
                } catch (e) {
                    // If DB is unavailable, still allow live chat
                    recent = [];
                }

                socket.to(roomId).emit('chat:presence', {
                    type: 'join',
                    user,
                    at: new Date().toISOString(),
                });

                return typeof ack === 'function' ? ack({ ok: true, roomId, recent }) : undefined;
            } catch (err) {
                return typeof ack === 'function'
                    ? ack({ ok: false, error: err?.message || 'Join failed' })
                    : undefined;
            }
        });

        // Client: socket.emit('chat:message', { roomId, user, text }, (resp) => ...)
        socket.on('chat:message', async (payload, ack) => {
            try {
                const roomId = normalizeRoomId(payload?.roomId || socket.data.roomId);
                const user = toSafeUser(payload?.user || socket.data.user);
                const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

                if (!roomId || !user || !text) {
                    return typeof ack === 'function'
                        ? ack({ ok: false, error: 'Invalid roomId, user, or text' })
                        : undefined;
                }

                if (!isValidObjectId(roomId)) {
                    return typeof ack === 'function'
                        ? ack({ ok: false, error: 'Invalid conversationId' })
                        : undefined;
                }

                // Enforce membership on each message (cheap check)
                const convo = await Conversation.findById(roomId).select('members').lean();
                if (!convo) {
                    return typeof ack === 'function'
                        ? ack({ ok: false, error: 'Conversation not found' })
                        : undefined;
                }

                const memberIds = Array.isArray(convo.members) ? convo.members.map((m) => String(m)) : [];
                if (!memberIds.includes(String(user.id))) {
                    return typeof ack === 'function'
                        ? ack({ ok: false, error: 'User is not a member of this conversation' })
                        : undefined;
                }

                let saved;
                try {
                    saved = await Message.create({
                        conversationId: roomId,
                        senderId: user.id,
                        text,
                    });
                } catch (e) {
                    // DB write failure: still broadcast the message
                    saved = {
                        _id: undefined,
                        conversationId: roomId,
                        senderId: user.id,
                        text,
                        createdAt: new Date(),
                    };
                }

                io.to(roomId).emit('chat:message', {
                    id: saved._id,
                    conversationId: saved.conversationId || roomId,
                    senderId: saved.senderId,
                    text: saved.text,
                    createdAt: saved.createdAt,
                });

                return typeof ack === 'function' ? ack({ ok: true }) : undefined;
            } catch (err) {
                return typeof ack === 'function'
                    ? ack({ ok: false, error: err?.message || 'Message failed' })
                    : undefined;
            }
        });

        // Optional: typing indicator
        socket.on('chat:typing', (payload) => {
            const roomId = normalizeRoomId(payload?.roomId || socket.data.roomId);
            const user = toSafeUser(payload?.user || socket.data.user);
            const isTyping = Boolean(payload?.isTyping);

            if (!roomId || !user) return;
            socket.to(roomId).emit('chat:typing', { user, isTyping });
        });

        socket.on('disconnect', () => {
            const roomId = socket.data.roomId;
            const user = socket.data.user;
            if (!roomId || !user) return;

            socket.to(roomId).emit('chat:presence', {
                type: 'leave',
                user,
                at: new Date().toISOString(),
            });
        });
    });
};
