import Script from 'next/script';

export default function AdultoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script id="aclib" src="//acscdn.com/script/aclib.js" strategy="afterInteractive" />
      <Script id="aclib-run" strategy="afterInteractive">
        {`
          const initAclib = setInterval(() => {
            if (typeof aclib !== 'undefined') {
              aclib.runAutoTag({
                  zoneId: 'i0wqo2yu4z',
              });
              clearInterval(initAclib);
            }
          }, 300);
          
          // Cleanup after 10s if it fails to load
          setTimeout(() => clearInterval(initAclib), 10000);
        `}
      </Script>
      {children}
    </>
  );
}
