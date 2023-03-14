import 'styles/tailwind.scss';
import type { AppProps } from 'next/app';
import Gtag from 'components/metadata/Gtag';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <>
            <Gtag />
            <Component {...pageProps} />
        </>
    );
}
