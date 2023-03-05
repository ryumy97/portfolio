import Gtag, { GtagBody } from 'components/metadata/Gtag';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang='en'>
            <Head />
            <body>
                <GtagBody />
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
