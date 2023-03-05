import { CodegenConfig } from '@graphql-codegen/cli';

const url = `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT}`;

const config: CodegenConfig = {
    overwrite: true,
    schema: [
        {
            [url]: {
                headers: {
                    Authorization: `Bearer ${process.env.CONTENTFUL_ACCESS_TOKEN}`,
                },
            },
        },
    ],
    documents: ['src/data/**/*.ts'],
    // ignoreNoDocuments: true, // for better experience with the watcher
    generates: {
        './src/data/gql/': {
            preset: 'client',
            config: {
                withHooks: false,
                inlineFragmentTypes: 'combine',
            },
        },
    },
};

export default config;
