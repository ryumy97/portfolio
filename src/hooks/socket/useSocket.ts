import { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const useSocket = (namespace: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(socket?.connected);

    useEffect(() => {
        const url = process.env.NEXT_PUBLIC_SOCKET_URL;

        const socket = io(`${url}${namespace}`);

        setSocket(socket);
        socket.connect();

        return () => {
            socket.disconnect();
        };
    }, [namespace]);

    useEffect(() => {
        const onConnect = () => {
            console.log('connect');
            setIsConnected(true);
        };

        const onDisconnect = () => {
            console.log('disconnect');
            setIsConnected(false);
        };

        socket?.on('connect', onConnect);
        socket?.on('disconnect', onDisconnect);

        return () => {
            socket?.off('connect', onConnect);
            socket?.off('disconnect', onDisconnect);
        };
    }, [socket]);

    return { socket, isConnected };
};

export default useSocket;
