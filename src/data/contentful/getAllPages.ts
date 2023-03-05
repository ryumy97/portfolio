import { gql } from '@apollo/client';
import {
    GetAllPagesDocument,
    GetAllPagesQuery,
    GetAllPagesQueryVariables,
} from 'data/gql/graphql';
import client, { previewClient } from './client';

export const getAllPagesQuery = gql`
    query GetAllPages($preview: Boolean) {
        pageCollection(preview: $preview) {
            __typename
            items {
                url
            }
        }
    }
`;

export const getAllPages = async (variables: GetAllPagesQueryVariables) => {
    let currentClient = variables.preview ? previewClient : client;

    const result = await currentClient.query<
        GetAllPagesQuery,
        GetAllPagesQueryVariables
    >({
        query: GetAllPagesDocument,
        variables,
    });

    return result.data.pageCollection?.items.map((item) => item?.url);
};
