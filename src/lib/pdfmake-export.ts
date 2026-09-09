export type PdfMakeDocument = Record<string, unknown>;

type PdfMakeApi = {
  createPdf: (document: PdfMakeDocument) => { download: (filename: string) => void };
};

type PdfMakeWindow = Window & { pdfMake?: PdfMakeApi & { default?: PdfMakeApi; pdfMake?: PdfMakeApi } };

function getPdfMake(): PdfMakeApi | undefined {
  const globalPdfMake = (window as unknown as PdfMakeWindow).pdfMake;
  return [globalPdfMake, globalPdfMake?.default, globalPdfMake?.pdfMake]
    .find(candidate => typeof candidate?.createPdf === 'function');
}

let loadingPdfMake: Promise<void> | undefined;

export function loadPdfMake(): Promise<void> {
  if (getPdfMake()) return Promise.resolve();
  if (!loadingPdfMake) loadingPdfMake = (async () => {
    const imported = await import("pdfmake/build/pdfmake");
    const pdfMake = (imported.default ?? imported) as PdfMakeApi;
    (window as unknown as PdfMakeWindow).pdfMake = pdfMake;
    await import("pdfmake/build/vfs_fonts");
    if (!getPdfMake()) throw new Error("PDF engine could not be initialized.");
  })().catch(error => {
    loadingPdfMake = undefined;
    throw error;
  });
  return loadingPdfMake;
}

export function downloadPdfWithPdfMake(document: PdfMakeDocument, filename: string) {
  const pdfMake = getPdfMake();
  if (!pdfMake) throw new Error('PDF engine is still loading or unavailable');
  pdfMake.createPdf(document).download(filename);
}
