import useReceive from 'hooks/socket/useReceive';
import { sendData } from 'hooks/socket/useSend';
import useSocket from 'hooks/socket/useSocket';
import { NextPage } from 'next';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const Socket: NextPage = () => {
    const { socket, isConnected } = useSocket('/admin');

    const [roomId, setRoomId] = useState('');
    const [users, setUsers] = useState(0);

    const mouseRef = useRef(null);

    useReceive<{ roomId: string }>(socket, 'room-id', ({ id, data }) => {
        setRoomId(data?.roomId);
    });

    useReceive<{ users: number }>(socket, 'room-user', ({ id, data }) => {
        setUsers(data?.users);
    });

    useReceive<{ x: number; y: number }>(
        socket,
        'mouse-location',
        ({ id, data }) => {
            console.log('mouse-location', data);

            gsap.to(mouseRef.current, {
                x: data.x,
                y: data.y,
            });
        }
    );

    return (
        <>
            <div>{isConnected ? 'connected' : 'not connected'}</div>
            <div>Room Id: {roomId}</div>
            <div>Users: {users}</div>
            <div
                className='absolute top-0 left-0 h-2 w-2 rounded-full bg-black'
                ref={mouseRef}
            ></div>
        </>
    );
};

export default Socket;
