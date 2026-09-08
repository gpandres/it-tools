export type PdfMakeDocument = Record<string, unknown>;

type PdfMakeApi = {
  createPdf: (document: PdfMakeDocument) => { download: (filename: string) => void };
};

export function downloadPdfWithPdfMake(document: PdfMakeDocument, filename: string) {
  const globalPdfMake = (window as unknown as { pdfMake?: PdfMakeApi & { default?: PdfMakeApi; pdfMake?: PdfMakeApi } }).pdfMake;
  const pdfMake = [globalPdfMake, globalPdfMake?.default, globalPdfMake?.pdfMake]
    .find(candidate => typeof candidate?.createPdf === 'function');
  if (!pdfMake) throw new Error('PDF engine is still loading or unavailable');
  pdfMake.createPdf(document).download(filename);
}
