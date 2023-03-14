import { Maybe } from 'graphql/jsutils/Maybe';
import { useEffect } from 'react';

const useReceive = <T>(
    socket: Maybe<any>,
    eventName: string,
    callback: (result: { id: string; data: T }) => void
) => {
    useEffect(() => {
        socket?.on(eventName, callback);

        return () => {
            socket?.off(eventName, callback);
        };
    }, [callback, eventName, socket]);
};

export default useReceive;
