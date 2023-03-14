import { gql } from '@apollo/client';
import {
    GetPageDetailsDocument,
    GetPageDetailsQuery,
    GetPageDetailsQueryVariables,
    Page,
} from 'data/gql/graphql';
import client, { previewClient } from './client';

export const getPageDetailsQuery = gql`
    query GetPageDetails($url: String!, $preview: Boolean) {
        pageCollection(where: { url: $url }, preview: $preview) {
            items {
                ...Page
            }
        }
    }
`;

export const getPageDetails = async (
    variables: GetPageDetailsQueryVariables
) => {
    let currentClient = variables.preview ? previewClient : client;

    const result = await currentClient.query<
        GetPageDetailsQuery,
        GetPageDetailsQueryVariables
    >({
        query: GetPageDetailsDocument,
        variables,
    });

    return result.data.pageCollection?.items[0];
};
