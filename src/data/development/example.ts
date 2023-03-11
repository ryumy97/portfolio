import { Page } from 'data/gql/graphql';

export const pageData: DeepPartial<Page> = {
    __typename: 'Page',
    url: '/',
    metadata: {
        __typename: 'Metadata',
        title: 'Ryumy 97',
        description: 'Portfolio Website by In Ha Ryu (Ryumy97)',
    },
    blocksCollection: {
        __typename: 'PageBlocksCollection',
        items: [
            {
                __typename: 'RichTextBlock',
                text: {
                    __typename: 'RichTextBlockText',
                    json: {
                        nodeType: 'document',
                        data: {},
                        content: [
                            {
                                nodeType: 'paragraph',
                                data: {},
                                content: [
                                    {
                                        nodeType: 'text',
                                        value: 'This is example richtext',
                                        marks: [],
                                        data: {},
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        ],
    },
};
