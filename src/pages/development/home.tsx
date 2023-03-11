import PageLoader from 'components/PageLoader';
import { pageData } from 'data/development/example';
import { NextPage } from 'next';

const Page: NextPage = (props) => {
    console.log(pageData);

    return (
        <>
            <PageLoader {...pageData}>
                <div>Hi</div>
            </PageLoader>
        </>
    );
};
export default Page;
