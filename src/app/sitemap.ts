import { MetadataRoute } from 'next'
import { toolsRegistry } from '@/lib/tools'
import { SITE_URL } from '@/lib/seo'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL
  
  const routes = ['', ...new Set(toolsRegistry.map((tool) => tool.path))]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
