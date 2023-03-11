import React from 'react';
import Metadata from './metadata';
import { Page } from 'data/gql/graphql';

const PageLoader: React.FC<React.PropsWithChildren<DeepPartial<Page>>> = (
    props
) => {
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
