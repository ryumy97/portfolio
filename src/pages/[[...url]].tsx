import PageLoader from 'components/PageLoader';
import { getAllPages } from 'data/contentful/getAllPages';
import { getPageDetails } from 'data/contentful/getPageDetails';
import { Page } from 'data/gql/graphql';
import {
    GetStaticPaths,
    GetStaticProps,
    InferGetStaticPropsType,
    NextPage,
} from 'next';

const Page: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (
    props
) => {
    console.log(props);

    return (
        <>
            <PageLoader {...props}>
                <div>Hi</div>
            </PageLoader>
        </>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const urls = await getAllPages({});

    if (!urls) {
        return {
            paths: [],
            fallback: 'blocking',
        };
    }

    const filteredUrls = urls.map((url) => ({
        params: { url: [...(url?.split('/').filter(Boolean) || [])] },
    }));

    return {
        paths: filteredUrls,
        fallback: 'blocking',
    };
};

export const getStaticProps: GetStaticProps<Partial<Page>> = async ({
    params,
}) => {
    const url = params?.url ? `/${(params?.url as string[]).join('/')}` : '/';

    const result = await getPageDetails({ url });

    if (!result) {
        return {
            notFound: true,
        };
    }

    return {
        props: result,
        revalidate: 1,
    };
};

export default Page;
