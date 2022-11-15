import Layout from 'containers/Layout';
import type { NextPage } from 'next';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';

const Home: NextPage = () => {
    const textRef = useRef(null);

    useEffect(() => {
        const text = textRef.current;

        gsap.to(text, {
            x: 100,
        });
    }, []);

    return (
        <>
            <Layout
                meta={{
                    title: 'Ryumy - Home',
                }}
            >
                <div ref={textRef}>Home</div>
            </Layout>
        </>
    );
};

export default Home;
