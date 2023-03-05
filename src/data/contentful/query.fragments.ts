import { gql } from '@apollo/client';

export const page = gql`
    fragment Page on Page {
        __typename
        url
        metadata {
            ...Metadata
        }

        blocksCollection {
            items {
                ...RichTextBlock
            }
        }
    }
`;

export const metadata = gql`
    fragment Metadata on Metadata {
        __typename
        title
        description
    }
`;

export const richTextBlock = gql`
    fragment RichTextBlock on RichTextBlock {
        __typename
        text {
            ...RichTextBlockText
        }
    }
`;

export const RichTextBlockText = gql`
    fragment RichTextBlockText on RichTextBlockText {
        __typename
        json
    }
`;
