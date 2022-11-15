import Head from 'next/head';
import React from 'react';

type Props = {
    meta: {
        title: string;
    };
    children: JSX.Element;
};

const Layout: React.FC<Props> = (props) => {
    const {
        meta: { title: metaTitle },
        children,
    } = props;

    return (
        <>
            <Head>
                <title>{metaTitle}</title>
            </Head>
            <header></header>
            <main>{children}</main>
            <footer></footer>
        </>
    );
};

export default Layout;
