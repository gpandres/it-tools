import { NextResponse } from "next/server";
import https from "https";
import dns from "dns/promises";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "Domain parameter is required" }, { status: 400 });
    }

    // Clean domain
    const cleanDomain = domain.replace(/^(https?:\/\/)/, "").replace(/\/.*$/, "").toLowerCase();

    const result = {
      domain: cleanDomain,
      headers: {} as Record<string, string>,
      tls: null as any,
      dns: {
        spf: null as string | null,
        dmarc: null as string | null,
      }
    };

    // 1. Fetch Headers and TLS Info
    const httpsResult = await new Promise<{ headers: any, tls: any }>((resolve) => {
      const req = https.request({
        hostname: cleanDomain,
        port: 443,
        method: "GET",
        timeout: 5000,
        rejectUnauthorized: false // We want to inspect the cert even if it's invalid
      }, (res) => {
        const socket = res.socket as import("tls").TLSSocket;
        const cert = socket.getPeerCertificate();
        
        let tlsInfo = null;
        if (cert && Object.keys(cert).length > 0) {
          tlsInfo = {
            issuer: cert.issuer?.O || cert.issuer?.CN || "Unknown",
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            subject: cert.subject?.CN || "Unknown",
            // @ts-ignore
            fingerprint: cert.fingerprint256 || cert.fingerprint,
          };
        }

        resolve({ headers: res.headers, tls: tlsInfo });
        // Abort the request since we only need headers and cert
        req.destroy();
      });

      req.on('error', (e) => {
        resolve({ headers: {}, tls: null });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ headers: {}, tls: null });
      });

      req.end();
    });

    result.headers = httpsResult.headers;
    result.tls = httpsResult.tls;

    // 2. Fetch DNS Records (SPF and DMARC)
    try {
      const txtRecords = await dns.resolveTxt(cleanDomain);
      for (const recordArray of txtRecords) {
        const record = recordArray.join("");
        if (record.toLowerCase().includes("v=spf1")) {
          result.dns.spf = record;
        }
      }
    } catch (e) {
      // DNS error or no TXT records
    }

    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${cleanDomain}`);
      for (const recordArray of dmarcRecords) {
        const record = recordArray.join("");
        if (record.toLowerCase().includes("v=dmarc1")) {
          result.dns.dmarc = record;
        }
      }
    } catch (e) {
      // DMARC DNS error
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze domain" }, { status: 500 });
  }
}
