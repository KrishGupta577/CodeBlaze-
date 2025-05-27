import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import http from 'http';
import { ACTIONS } from './utils/Actions.js';

dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

app.use(cors())

// Set up Socket.io with CORS configuration
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
    }
})

const userSocketMap = {}

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            userId: userSocketMap[socketId],
        }
    })
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, userId }) => {
        userSocketMap[socket.id] = userId
        socket.join(roomId)
        const clients = getAllConnectedClients(roomId)
        console.log(clients)
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                userId,
                socketId,
            })
        })
    })

    socket.on(ACTIONS.CODE_CHANGE, ({ value, roomId }) => {

        console.log(value, roomId)

        const clients = getAllConnectedClients(roomId)

        console.log(clients)

        const code = value
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.SYNC_CODE, {
                code
            })
        })
    })

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms]
        const userId = userSocketMap[socket.id];

        console.log(userId)
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                userId: userId,
            })
        })

        delete userSocketMap[socket.id]
        socket.leave()
    })

});


// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Socket server is running');
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});