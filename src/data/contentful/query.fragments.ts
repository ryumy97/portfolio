import { gql } from '@apollo/client';

export const metadata = gql`
    fragment Metadata on Metadata {
        title
        description
    }
`;

export const richTextBlock = gql`
    fragment RichTextBlock on RichTextBlock {
        text {
            ...RichText
        }
    }
`;

export const RichTextBlockText = gql`
    fragment RichText on RichTextBlockText {
        json
    }
`;
