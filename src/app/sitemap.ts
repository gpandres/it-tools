import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tools.andresgp.dev'
  
  const routes = [
    '',
    '/tools/network/ip-converter',
    '/tools/network/subnet',
    '/tools/network/cidr',
    '/tools/network/vlsm',
    '/tools/network/mac',
    '/tools/crypto/hash',
    '/tools/crypto/uuid',
    '/tools/crypto/password',
    '/tools/encoding/base64',
    '/tools/encoding/url',
    '/tools/encoding/json-yaml',
    '/tools/encoding/jwt',
    '/tools/encoding/number-base',
    '/tools/text/diff',
    '/tools/text/regex',
    '/tools/text/json',
    '/tools/text/counter',
    '/tools/text/lorem',
    '/tools/security/scorecard',
    '/tools/security/log-parser',
    '/tools/security/pcap',
    '/tools/other/qr',
    '/tools/other/cron',
    '/tools/other/color',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
