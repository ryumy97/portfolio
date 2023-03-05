import React from 'react';
import Metadata from './Metadata';
import { PageDetail } from 'types/contentful';

const PageLoader: React.FC<React.PropsWithChildren<PageDetail>> = (props) => {
    const { metadata, children } = props;

    return (
        <>
            {metadata && <Metadata {...metadata} />}
            <header></header>
            <main>{children}</main>
            <footer></footer>
        </>
    );
};

export default PageLoader;
