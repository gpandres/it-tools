"use client";

import { useEffect } from 'react';
import { loadPdfMake } from '@/lib/pdfmake-export';

export function PdfMakeScripts() {
  useEffect(() => { void loadPdfMake().catch(error => console.error("Failed to load local PDF engine", error)); }, []);
  return null;
}
