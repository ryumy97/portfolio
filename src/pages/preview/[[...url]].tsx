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
    return (
        <>
            <PageLoader {...props}>
                <div>Hi</div>
            </PageLoader>
        </>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const urls = await getAllPages({
        preview: true,
    });
    console.log(urls);

    if (!urls) {
        return {
            paths: [],
            fallback: 'blocking',
        };
    }

    const filteredUrls = urls
        .filter<string>((url: string | null | undefined): url is string => {
            return url !== null && url !== undefined;
        })
        .map((url) => ({
            params: { url: [...url.split('/')] },
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

    const result = await getPageDetails({ url, preview: true });

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
