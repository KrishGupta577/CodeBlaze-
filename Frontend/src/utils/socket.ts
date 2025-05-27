import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';

export const initSocket = async (): Promise<Socket<DefaultEventsMap, DefaultEventsMap>> => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

    if (!socketUrl) {
        console.error('Socket server URL not defined');
        throw new Error('Socket server URL not defined');
    }

    const options = {
        autoConnect: true,
        'force new connection': true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket'],
    };

    const socket = io(socketUrl, options);

    return new Promise((resolve, reject) => {
        socket.on('connect', () => {
            console.log('Socket connected');
            resolve(socket);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            reject(error);
        });

        socket.connect();
    });
};