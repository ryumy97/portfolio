import React from 'react';
import Script from 'next/script';

const Gtag: React.FC = () => {
    return (
        <>
            <Script id='gtag' strategy='lazyOnload'>
                {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTAG_ID}');
                `}
            </Script>
            <Script
                async
                src='https://www.googletagmanager.com/gtag/js?id=G-RVLSLT9F14'
            ></Script>
            <Script id='ga' strategy='lazyOnload'>
                {`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
  `}
            </Script>
        </>
    );
};

export const GtagBody: React.FC = () => {
    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTAG_ID}`}
                height='0'
                width='0'
                style={{ display: 'none', visibility: 'hidden' }}
            ></iframe>
        </noscript>
    );
};

export default Gtag;
