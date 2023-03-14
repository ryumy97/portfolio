import { useEffect } from 'react';

export const sendData = <T>(socket: any, eventName: string, data: T) => {
    socket?.emit(eventName, data);
};

const useSend = <T>(socket: any, eventName: string, data: T) => {
    useEffect(() => {
        sendData(socket, eventName, data);
    }, [data, eventName, socket]);
};

export default useSend;
