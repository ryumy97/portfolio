import useReceive from 'hooks/socket/useReceive';
import { sendData } from 'hooks/socket/useSend';
import useSocket from 'hooks/socket/useSocket';
import {
    GetServerSideProps,
    GetStaticPaths,
    GetStaticProps,
    InferGetServerSidePropsType,
    NextPage,
} from 'next';
import { useEffect } from 'react';

const User: NextPage<InferGetServerSidePropsType<typeof getStaticProps>> = (
    props
) => {
    const { id } = props;

    const { socket, isConnected } = useSocket('/user');

    useEffect(() => {
        if (socket && isConnected) {
            sendData(socket, 'set-room', {
                id,
            });
        }
    }, [id, isConnected, socket]);

    useEffect(() => {
        if (socket && isConnected) {
            const onMouseMove = (event: MouseEvent) => {
                sendData(socket, 'mouse-location', {
                    x: event.clientX,
                    y: event.clientY,
                });
            };

            window.addEventListener('mousemove', onMouseMove);

            return () => {
                window.removeEventListener('mousemove', onMouseMove);
            };
        }
    }, [socket, isConnected]);

    return <>???</>;
};

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [],
        fallback: 'blocking',
    };
};

export const getStaticProps: GetStaticProps = async (context) => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL;

    const data = (await fetch(`${url}/room`).then((res) =>
        res.json()
    )) as string[];

    console.log(data);

    const id = context?.params?.id as string;

    if (!data.find((item) => item === id)) {
        return {
            notFound: true,
        };
    }

    return {
        props: { id },
    };
};

export default User;
