import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  }

  connect(userId) {
    if (this.socket && this.socket.connected) {
      if (userId) this.socket.emit('addUser', userId);
      return this.socket;
    }

    this.socket = io(this.url, {
      transports: ['websocket'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      if (userId) Object.keys(this.socket).length > 0 && this.socket.emit('addUser', userId);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(messageData) {
    if (this.socket) {
      this.socket.emit('sendMessage', messageData);
    }
  }

  onReceiveMessage(callback) {
    if (this.socket) {
      this.socket.on('receiveMessage', callback);
    }
  }

  offReceiveMessage(callback) {
    if (this.socket) {
      this.socket.off('receiveMessage', callback);
    }
  }
}

export default new SocketService();
