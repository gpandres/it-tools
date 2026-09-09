import { NextResponse } from "next/server";
import https from "https";
import dns from "dns/promises";
import net from "net";
import type { IncomingHttpHeaders } from "http";
import type { PeerCertificate, TLSSocket } from "tls";
import { isPublicInternetAddress } from "@/lib/network-target";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TlsInfo = {
  issuer: string;
  validFrom?: string;
  validTo?: string;
  subject: string;
  fingerprint?: string;
  valid: boolean;
  validationError?: string;
};

function toHeaderRecord(headers: IncomingHttpHeaders): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : String(value)])
  );
}

function certificateName(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value.join(", ") : value || "Unknown";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "Domain parameter is required" }, { status: 400 });
    }

    const candidate = domain.trim().match(/^(?:https?:\/\/)?([^/]+)(?:\/.*)?$/i)?.[1] ?? "";
    const cleanDomain = candidate.toLowerCase();
    if (!cleanDomain || cleanDomain.includes("@") || cleanDomain.includes(":")) {
      return NextResponse.json({ error: "Enter a public domain without a port or credentials" }, { status: 400 });
    }
    if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(cleanDomain)) {
      return NextResponse.json({ error: "Only fully-qualified public DNS names are supported" }, { status: 400 });
    }

    const resolved = await dns.lookup(cleanDomain, { all: true, verbatim: true });
    const publicAddress = resolved.find(({ address }) => isPublicInternetAddress(address))?.address;
    if (!publicAddress || resolved.some(({ address }) => !isPublicInternetAddress(address))) {
      return NextResponse.json({ error: "The target resolves to a private or restricted address" }, { status: 400 });
    }

    const result = {
      domain: cleanDomain,
      headers: {} as Record<string, string>,
      tls: null as TlsInfo | null,
      dns: {
        spf: null as string | null,
        dmarc: null as string | null,
      }
    };

    // 1. Fetch Headers and TLS Info
    const httpsResult = await new Promise<{ headers: Record<string, string>, tls: TlsInfo | null }>((resolve) => {
      const req = https.request({
        hostname: cleanDomain,
        // Pin the connection to the address that was checked above to reduce DNS rebinding risk.
        lookup: (_hostname, _options, callback) => callback(null, publicAddress, net.isIPv6(publicAddress) ? 6 : 4),
        port: 443,
        method: "GET",
        timeout: 5000,
        rejectUnauthorized: false // We want to inspect the cert even if it's invalid
      }, (res) => {
        const socket = res.socket as TLSSocket;
        const cert: PeerCertificate = socket.getPeerCertificate();
        
        let tlsInfo: TlsInfo | null = null;
        if (cert && Object.keys(cert).length > 0) {
          tlsInfo = {
            issuer: certificateName(cert.issuer?.O || cert.issuer?.CN),
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            subject: certificateName(cert.subject?.CN),
            fingerprint: cert.fingerprint256 || cert.fingerprint,
            valid: socket.authorized,
            validationError: socket.authorizationError instanceof Error
              ? socket.authorizationError.message
              : socket.authorizationError || undefined,
          };
        }

        resolve({ headers: toHeaderRecord(res.headers), tls: tlsInfo });
        // Abort the request since we only need headers and cert
        req.destroy();
      });

      req.on('error', () => {
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
    } catch {
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
    } catch {
      // DMARC DNS error
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze domain" }, { status: 500 });
  }
}
