"use client";

import Script from 'next/script';
import { useState } from 'react';

export function PdfMakeScripts() {
  const [coreLoaded, setCoreLoaded] = useState(false);
  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js" strategy="afterInteractive" onLoad={() => setCoreLoaded(true)} />
      {coreLoaded && <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.min.js" strategy="afterInteractive" />}
    </>
  );
}
