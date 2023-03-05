import { MetadataFragment } from 'data/gql/graphql';
import Head from 'next/head';
import React from 'react';

const Metadata: React.FC<MetadataFragment> = (props) => {
    const { title, description } = props;

    return (
        <>
            <Head>
                <title>{title}</title>
                {description && (
                    <meta name='description' content={description}></meta>
                )}
            </Head>
        </>
    );
};

export default Metadata;
