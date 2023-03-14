import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    uri: `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT}`,
    headers: {
        authorization: `Bearer ${process.env.CONTENTFUL_ACCESS_TOKEN}`,
    },
    cache: new InMemoryCache(),
});

export const previewClient = new ApolloClient({
    uri: `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT}`,
    headers: {
        authorization: `Bearer ${process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN}`,
    },
    cache: new InMemoryCache(),
});

export default client;
