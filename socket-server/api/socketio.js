// api/socketio.js
import { Server } from 'socket.io';

// Define ACTIONS inline since imports might not work as expected
const ACTIONS = {
  JOIN: 'join',
  JOINED: 'joined',
  DISCONNECTED: 'disconnected',
  CODE_CHANGE: 'code-change',
  SYNC_CODE: 'sync-code',
};

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
      }
    });
    
    res.socket.server.io = io;

    const userSocketMap = {};

    function getAllConnectedClients(roomId) {
      return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
          socketId,
          userId: userSocketMap[socketId],
        };
      });
    }

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on(ACTIONS.JOIN, ({ roomId, userId }) => {
        userSocketMap[socket.id] = userId;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        console.log(clients);
        clients.forEach(({ socketId }) => {
          io.to(socketId).emit(ACTIONS.JOINED, {
            clients,
            userId,
            socketId,
          });
        });
      });

      socket.on(ACTIONS.CODE_CHANGE, ({ value, roomId }) => {
        console.log(value, roomId);
        const clients = getAllConnectedClients(roomId);
        console.log(clients);
        const code = value;
        clients.forEach(({ socketId }) => {
          io.to(socketId).emit(ACTIONS.SYNC_CODE, {
            code
          });
        });
      });

      socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        const userId = userSocketMap[socket.id];
        console.log(userId);
        rooms.forEach((roomId) => {
          socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
            socketId: socket.id,
            userId: userId,
          });
        });
        delete userSocketMap[socket.id];
        socket.leave();
      });
    });
  }
  res.end();
};

export default SocketHandler;