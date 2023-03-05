import { MetadataFragment, RichTextBlockFragment } from 'data/gql/graphql';

export type PageDetail = {
    url?: Maybe<string>;
    metadata?: Maybe<MetadataFragment>;
    blocksCollection?: Maybe<{
        items: Maybe<Block>[];
    }>;
};

export type Block = RichTextBlockFragment;
